const Shift = require('../models/Shift');

const populate = [
  { path: 'supervisor',      select: 'name avatar' },
  { path: 'assignedWorkers', select: 'name avatar department' },
  { path: 'attendance.user', select: 'name avatar' },
  { path: 'createdBy',       select: 'name' },
];

// GET /api/shifts
exports.getShifts = async (req, res, next) => {
  try {
    const { from, to, department, status, page = 1, limit = 30 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (status)     query.status     = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }
    // Workers see only their own shifts
    if (req.user.role === 'user') {
      query.assignedWorkers = req.user._id;
    }

    const [shifts, total] = await Promise.all([
      Shift.find(query).populate(populate).sort('-date')
        .skip((page - 1) * Number(limit)).limit(Number(limit)),
      Shift.countDocuments(query),
    ]);
    res.json({ success: true, data: shifts, total });
  } catch (err) { next(err); }
};

// GET /api/shifts/:id
exports.getShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id).populate(populate);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found.' });
    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
};

// POST /api/shifts
exports.createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create({ ...req.body, createdBy: req.user._id });
    await shift.populate(populate);
    req.io.emit('shift:created', shift);
    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
};

// PUT /api/shifts/:id
exports.updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found.' });
    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
};

// POST /api/shifts/:id/attendance  — mark attendance for a shift
exports.markAttendance = async (req, res, next) => {
  try {
    const { attendance } = req.body;  // [{ user, status, checkIn, checkOut, note }]
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found.' });

    // Calculate hours worked for each entry
    const processed = attendance.map(a => {
      let hoursWorked = 0;
      let overtime    = 0;
      if (a.checkIn && a.checkOut) {
        const ms   = new Date(a.checkOut) - new Date(a.checkIn);
        hoursWorked = parseFloat((ms / 3600000).toFixed(2));
        const [sh, sm] = shift.startTime.split(':').map(Number);
        const [eh, em] = shift.endTime.split(':').map(Number);
        const shiftHours = (eh * 60 + em - sh * 60 - sm) / 60;
        overtime = Math.max(0, parseFloat((hoursWorked - shiftHours).toFixed(2)));
      }
      return { ...a, hoursWorked, overtime };
    });

    shift.attendance = processed;
    shift.status = 'completed';
    await shift.save();
    await shift.populate(populate);

    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
};

// GET /api/shifts/attendance-report  — monthly attendance summary per user
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = Number(month || new Date().getMonth() + 1);
    const y = Number(year  || new Date().getFullYear());
    const from = new Date(y, m - 1, 1);
    const to   = new Date(y, m, 0, 23, 59, 59);

    const shifts = await Shift.find({ date: { $gte: from, $lte: to }, status: 'completed' })
      .populate('attendance.user', 'name department');

    const userMap = {};
    for (const shift of shifts) {
      for (const a of shift.attendance) {
        const uid  = String(a.user?._id || a.user);
        const name = a.user?.name || uid;
        if (!userMap[uid]) userMap[uid] = { userId: uid, name, department: a.user?.department || '', present: 0, absent: 0, halfDay: 0, late: 0, totalHours: 0, overtime: 0 };
        if (a.status === 'present')  userMap[uid].present++;
        if (a.status === 'absent')   userMap[uid].absent++;
        if (a.status === 'half_day') userMap[uid].halfDay++;
        if (a.status === 'late')     { userMap[uid].late++; userMap[uid].present++; }
        userMap[uid].totalHours += a.hoursWorked || 0;
        userMap[uid].overtime   += a.overtime    || 0;
      }
    }

    res.json({ success: true, data: Object.values(userMap), month: m, year: y });
  } catch (err) { next(err); }
};

// DELETE /api/shifts/:id
exports.deleteShift = async (req, res, next) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Shift deleted.' });
  } catch (err) { next(err); }
};
