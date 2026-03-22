const router = require('express').Router();
const ctrl   = require('../controllers/productController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/',              authorize('admin', 'supervisor'), ctrl.getProducts);
router.get('/:id',           authorize('admin', 'supervisor'), ctrl.getProduct);
router.get('/:id/logs',      authorize('admin', 'supervisor'), ctrl.getInventoryLogs);
router.post('/',             authorize('admin'),               ctrl.createProduct);
router.put('/:id',           authorize('admin'),               ctrl.updateProduct);
router.delete('/:id',        authorize('admin'),               ctrl.deleteProduct);
router.post('/:id/stock',    authorize('admin', 'supervisor'), ctrl.adjustStock);

module.exports = router;
