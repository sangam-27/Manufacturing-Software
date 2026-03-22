// ═══════════════════════════════════════════
// routes/suppliers.js
// ═══════════════════════════════════════════
const router = require('express').Router();
const ctrl   = require('../controllers/supplierController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/',     authorize('admin','supervisor'), ctrl.getSuppliers);
router.get('/:id',  authorize('admin','supervisor'), ctrl.getSupplier);
router.post('/',    authorize('admin'),              ctrl.createSupplier);
router.put('/:id',  authorize('admin'),              ctrl.updateSupplier);
router.delete('/:id', authorize('admin'),            ctrl.deleteSupplier);

module.exports = router;
