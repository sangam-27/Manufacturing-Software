const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getDashboard);

module.exports = router;
