const Task = require('../models/Task');

const populate = [
  { path: 'assignedTo', select: 'name avatar' },
  { path: 'order',      select: 'orderId product', populate: { path: 'product', select: 'name' } },
  { path: 'createdBy',  select: 'name' },
];

// ── GET /api/tasks ────────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, order, page = 1, limit = 50 } = req.query;
    const query = {};

    // Workers see only their tasks
    if (req.user.role === 'user') query.assignedTo = req.user._id;

    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (order)    query.order    = order;

    const [tasks, total] = await Promise.all([
      Task.find(query).populate(populate).sort('-createdAt').skip((page - 1) * Number(limit)).limit(Number(limit)),
      Task.countDocuments(query),
    ]);

    res.json({ success: true, data: tasks, total });
  } catch (err) { next(err); }
};

// ── POST /api/tasks ───────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate(populate);
    req.io.emit('task:created', task);
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const allowed = ['title', 'status', 'priority', 'progress', 'dueDate', 'description', 'assignedTo'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate(populate);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    req.io.emit('task:updated', task);
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) { next(err); }
};
