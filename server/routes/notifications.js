const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/',              ctrl.getNotifications);
router.patch('/read-all',    ctrl.markAllRead);
router.patch('/:id/read',    ctrl.markRead);
router.post('/',             authorize('admin'), ctrl.createNotification);

module.exports = router;
