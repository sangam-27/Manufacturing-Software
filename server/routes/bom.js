// routes/bom.js
const r1   = require('express').Router();
const bom  = require('../controllers/bomController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

r1.use(protect);
r1.get('/',                   authorize('admin','supervisor'), bom.getBOMs);
r1.get('/product/:productId', authorize('admin','supervisor'), bom.getBOMByProduct);
r1.get('/:id',                authorize('admin','supervisor'), bom.getBOM);
r1.post('/',                  authorize('admin'),              bom.createBOM);
r1.put('/:id',                authorize('admin'),              bom.updateBOM);
r1.delete('/:id',             authorize('admin'),              bom.deleteBOM);
r1.post('/:id/check-availability', authorize('admin','supervisor'), bom.checkAvailability);

module.exports = r1;
