const router = require('express').Router();
const ctrl   = require('../controllers/reportsController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('admin'));
router.get('/gst',       ctrl.getGSTReport);
router.get('/financial', ctrl.getFinancialReport);

module.exports = router;
