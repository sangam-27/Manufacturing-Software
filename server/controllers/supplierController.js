const Supplier       = require('../models/Supplier');
const PurchaseOrder  = require('../models/PurchaseOrder');

// GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { name:         { $regex: search, $options: 'i' } },
      { gstNumber:    { $regex: search, $options: 'i' } },
      { contactPerson:{ $regex: search, $options: 'i' } },
    ];

    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort('name').skip((page - 1) * Number(limit)).limit(Number(limit)),
      Supplier.countDocuments(query),
    ]);
    res.json({ success: true, data: suppliers, total });
  } catch (err) { next(err); }
};

// GET /api/suppliers/:id
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    const orders = await PurchaseOrder.find({ supplier: req.params.id })
      .sort('-createdAt').limit(10).populate('items.product', 'name sku');
    res.json({ success: true, data: supplier, recentOrders: orders });
  } catch (err) { next(err); }
};

// POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

// DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res, next) => {
  try {
    const hasOrders = await PurchaseOrder.exists({ supplier: req.params.id });
    if (hasOrders) return res.status(400).json({ success: false, message: 'Cannot delete: supplier has purchase orders.' });
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted.' });
  } catch (err) { next(err); }
};
