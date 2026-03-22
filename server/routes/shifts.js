const router = require('express').Router();
const ctrl   = require('../controllers/shiftController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/attendance-report',  authorize('admin','supervisor'), ctrl.getAttendanceReport);
router.get('/',                   ctrl.getShifts);
router.get('/:id',                ctrl.getShift);
router.post('/',                  authorize('admin','supervisor'), ctrl.createShift);
router.put('/:id',                authorize('admin','supervisor'), ctrl.updateShift);
router.post('/:id/attendance',    authorize('admin','supervisor'), ctrl.markAttendance);
router.delete('/:id',             authorize('admin'),              ctrl.deleteShift);

module.exports = router;
