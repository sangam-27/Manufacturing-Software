/**
 * Role-Based Access Control middleware
 * Usage: router.get('/', protect, authorize('admin','supervisor'), handler)
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}.`,
    });
  }
  next();
};
