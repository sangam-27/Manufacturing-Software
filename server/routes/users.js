const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('admin'));

router.get('/',     ctrl.getUsers);
router.get('/:id',  ctrl.getUser);
router.put('/:id',  ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;
