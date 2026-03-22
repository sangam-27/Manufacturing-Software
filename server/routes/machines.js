const router = require('express').Router();
const ctrl   = require('../controllers/machineController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/due-maintenance',        authorize('admin','supervisor'), ctrl.getDueMaintenance);
router.get('/',                       authorize('admin','supervisor'), ctrl.getMachines);
router.get('/:id',                    authorize('admin','supervisor'), ctrl.getMachine);
router.post('/',                      authorize('admin'),              ctrl.createMachine);
router.put('/:id',                    authorize('admin','supervisor'), ctrl.updateMachine);
router.post('/:id/maintenance',       authorize('admin','supervisor'), ctrl.addMaintenanceLog);
router.delete('/:id',                 authorize('admin'),              ctrl.deleteMachine);

module.exports = router;
