const router = require('express').Router();
const ctrl   = require('../controllers/billingController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('admin'));

router.get('/',                ctrl.getInvoices);
router.get('/:id',             ctrl.getInvoice);
router.post('/',               ctrl.createInvoice);
router.patch('/:id/status',    ctrl.updateStatus);
router.delete('/:id',          ctrl.deleteInvoice);

module.exports = router;
