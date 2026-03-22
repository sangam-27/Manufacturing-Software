const router = require('express').Router();
const ctrl   = require('../controllers/taskController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/',       ctrl.getTasks);
router.post('/',      authorize('admin', 'supervisor'), ctrl.createTask);
router.patch('/:id',  ctrl.updateTask);
router.delete('/:id', authorize('admin', 'supervisor'), ctrl.deleteTask);

module.exports = router;
