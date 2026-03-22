const ProductionOrder = require('../models/ProductionOrder');
const Task            = require('../models/Task');

const populate = [
  { path: 'product',    select: 'name sku category' },
  { path: 'assignedTo', select: 'name avatar role' },
  { path: 'supervisor', select: 'name avatar' },
  { path: 'createdBy',  select: 'name' },
  { path: 'timeline.completedBy', select: 'name' },
];

// ── GET /api/production ───────────────────────────────────────────────────────
exports.getOrders = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    // Workers only see their own orders
    if (req.user.role === 'user') query.assignedTo = req.user._id;
    else if (assignedTo)          query.assignedTo = assignedTo;

    if (status)   query.status   = status;
    if (priority) query.priority = priority;

    const [orders, total] = await Promise.all([
      ProductionOrder.find(query)
        .populate(populate)
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      ProductionOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── GET /api/production/:id ───────────────────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await ProductionOrder.findById(req.params.id).populate(populate);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// ── POST /api/production ──────────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const order = await ProductionOrder.create({ ...req.body, createdBy: req.user._id });
    await order.populate(populate);

    // Auto-create default tasks for this order
    const defaultTasks = ['Raw material inspection', 'Machine setup', 'Production run', 'Quality check', 'Packaging & dispatch'];
    if (order.assignedTo) {
      await Task.insertMany(
        defaultTasks.map((title, i) => ({
          title,
          order: order._id,
          assignedTo: order.assignedTo,
          priority: order.priority,
          dueDate: order.dueDate,
          createdBy: req.user._id,
        }))
      );
    }

    req.io.emit('order:created', order);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

// ── PUT /api/production/:id ───────────────────────────────────────────────────
exports.updateOrder = async (req, res, next) => {
  try {
    const allowed = ['status', 'priority', 'assignedTo', 'supervisor', 'dueDate', 'notes'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const order = await ProductionOrder.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).populate(populate);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    req.io.to(`order:${order._id}`).emit('order:updated', order);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// ── PATCH /api/production/:id/progress ───────────────────────────────────────
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress, note } = req.body;
    const order = await ProductionOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Role check: worker can only update their own order
    if (req.user.role === 'user' && String(order.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    order.progress = Number(progress);
    if (order.progress >= 100) { order.progress = 100; order.status = 'completed'; }
    else if (order.progress > 0 && order.status === 'pending') order.status = 'in_progress';

    if (note) {
      order.timeline.push({ stage: note, completedBy: req.user._id });
    }

    await order.save();
    await order.populate(populate);

    req.io.to(`order:${order._id}`).emit('order:progress', { orderId: order._id, progress: order.progress, status: order.status });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// ── DELETE /api/production/:id ────────────────────────────────────────────────
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await ProductionOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    // Also delete associated tasks
    await Task.deleteMany({ order: req.params.id });
    req.io.emit('order:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) { next(err); }
};
