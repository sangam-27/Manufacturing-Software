const router = require('express').Router();
const ctrl   = require('../controllers/purchaseOrderController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/',                    authorize('admin','supervisor'), ctrl.getPOs);
router.get('/:id',                 authorize('admin','supervisor'), ctrl.getPO);
router.post('/',                   authorize('admin'),              ctrl.createPO);
router.patch('/:id/status',        authorize('admin','supervisor'), ctrl.updateStatus);
router.patch('/:id/receive',       authorize('admin','supervisor'), ctrl.receiveItems);
router.delete('/:id',              authorize('admin'),              ctrl.deletePO);

module.exports = router;
