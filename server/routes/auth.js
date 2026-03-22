// routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/login',           ctrl.login);
router.post('/register', protect, authorize('admin'), ctrl.register);
router.get('/me',        protect, ctrl.getMe);
router.put('/change-password', protect, ctrl.changePassword);

module.exports = router;
