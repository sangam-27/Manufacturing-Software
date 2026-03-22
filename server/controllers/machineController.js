const Machine      = require('../models/Machine');
const Notification = require('../models/Notification');

const populate = [
  { path: 'assignedTo', select: 'name avatar' },
  { path: 'createdBy',  select: 'name' },
  { path: 'maintenanceLogs.performedBy', select: 'name' },
];

// GET /api/machines
exports.getMachines = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (category) query.category = category;
    if (search)   query.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { machineId: { $regex: search, $options: 'i' } },
    ];

    const [machines, total] = await Promise.all([
      Machine.find(query).populate(populate).sort('name')
        .skip((page - 1) * Number(limit)).limit(Number(limit)),
      Machine.countDocuments(query),
    ]);
    res.json({ success: true, data: machines, total });
  } catch (err) { next(err); }
};

// GET /api/machines/:id
exports.getMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findById(req.params.id).populate(populate);
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found.' });
    res.json({ success: true, data: machine });
  } catch (err) { next(err); }
};

// POST /api/machines
exports.createMachine = async (req, res, next) => {
  try {
    const machine = await Machine.create({ ...req.body, createdBy: req.user._id });
    await machine.populate(populate);
    res.status(201).json({ success: true, data: machine });
  } catch (err) { next(err); }
};

// PUT /api/machines/:id
exports.updateMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate);
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found.' });
    res.json({ success: true, data: machine });
  } catch (err) { next(err); }
};

// POST /api/machines/:id/maintenance  — add a maintenance log entry
exports.addMaintenanceLog = async (req, res, next) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found.' });

    const log = {
      ...req.body,
      performedBy: req.user._id,
      status: req.body.status || 'done',
    };
    machine.maintenanceLogs.unshift(log);

    if (log.status === 'done') {
      machine.lastMaintenanceDate = new Date();
      const next = new Date();
      next.setDate(next.getDate() + machine.maintenanceIntervalDays);
      machine.nextMaintenanceDate = next;
      machine.status = 'operational';
    } else if (log.type === 'breakdown') {
      machine.status = 'breakdown';
    } else if (log.status === 'in_progress') {
      machine.status = 'maintenance';
    }

    await machine.save();
    await machine.populate(populate);

    // Emit notification on breakdown
    if (log.type === 'breakdown') {
      const notif = await Notification.create({
        title: 'Machine Breakdown Alert',
        message: `${machine.name} (${machine.machineId}) reported as breakdown.`,
        type: 'danger', category: 'maintenance', isGlobal: true,
        refId: machine._id, refModel: 'Machine', createdBy: req.user._id,
      });
      req.io.emit('notification:new', notif);
    }

    req.io.emit('machine:updated', machine);
    res.json({ success: true, data: machine });
  } catch (err) { next(err); }
};

// GET /api/machines/due-maintenance  — machines due for maintenance soon
exports.getDueMaintenance = async (req, res, next) => {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);

    const machines = await Machine.find({
      nextMaintenanceDate: { $lte: threshold },
      status: { $ne: 'decommissioned' },
    }).populate('assignedTo', 'name').sort('nextMaintenanceDate');

    res.json({ success: true, data: machines });
  } catch (err) { next(err); }
};

// DELETE /api/machines/:id
exports.deleteMachine = async (req, res, next) => {
  try {
    await Machine.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Machine deleted.' });
  } catch (err) { next(err); }
};
