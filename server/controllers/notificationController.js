const Notification = require('../models/Notification');

// GET /api/notifications  — get notifications for current user
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, unread } = req.query;
    const query = {
      $or: [
        { isGlobal: true },
        { recipients: req.user._id },
      ],
    };
    if (unread === 'true') query.readBy = { $ne: req.user._id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort('-createdAt').skip((page - 1) * Number(limit)).limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, readBy: { $ne: req.user._id } }),
    ]);

    const withRead = notifications.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.some(id => String(id) === String(req.user._id)),
    }));

    res.json({ success: true, data: withRead, total, unreadCount });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ isGlobal: true }, { recipients: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// POST /api/notifications  — create manual notification (admin)
exports.createNotification = async (req, res, next) => {
  try {
    const notif = await Notification.create({ ...req.body, createdBy: req.user._id });
    req.io.emit('notification:new', notif);
    res.status(201).json({ success: true, data: notif });
  } catch (err) { next(err); }
};
