const User = require('../models/User');

// ── GET /api/users ────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role)   query.role   = role;
    if (status) query.status = status;
    if (search) query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query).sort('name').skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/users/:id ────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── PUT /api/users/:id ────────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'role', 'department', 'status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};
