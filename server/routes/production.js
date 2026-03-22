const router = require('express').Router();
const ctrl   = require('../controllers/productionController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/',                 ctrl.getOrders);
router.get('/:id',              ctrl.getOrder);
router.post('/',                authorize('admin', 'supervisor'), ctrl.createOrder);
router.put('/:id',              authorize('admin', 'supervisor'), ctrl.updateOrder);
router.patch('/:id/progress',   ctrl.updateProgress);        // all roles (with ownership check)
router.delete('/:id',           authorize('admin'),           ctrl.deleteOrder);

module.exports = router;
