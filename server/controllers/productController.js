const Product      = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// ── GET /api/products ─────────────────────────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (category) query.category = category;
    if (status)   query.status   = status;
    if (search)   query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku:  { $regex: search, $options: 'i' } },
    ];

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('createdBy', 'name avatar')
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── GET /api/products/:id ─────────────────────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ── POST /api/products ────────────────────────────────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    req.io.emit('product:created', product);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    req.io.emit('product:updated', product);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    req.io.emit('product:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/stock  (adjust stock) ─────────────────────────────
exports.adjustStock = async (req, res, next) => {
  try {
    const { type, quantity, reason = '', reference = '' } = req.body;
    if (!['in', 'out', 'adjustment'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Use in | out | adjustment.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const stockBefore = product.stock;

    if (type === 'in')         product.stock += Number(quantity);
    else if (type === 'out') {
      if (product.stock < quantity)
        return res.status(400).json({ success: false, message: 'Insufficient stock.' });
      product.stock -= Number(quantity);
    } else {
      product.stock = Number(quantity);   // absolute adjustment
    }

    await product.save();

    await InventoryLog.create({
      product: product._id, type, quantity: Number(quantity),
      reason, reference,
      stockBefore, stockAfter: product.stock,
      performedBy: req.user._id,
    });

    if (product.stock < product.minStock) {
      req.io.emit('alert:low_stock', { productId: product._id, name: product.name, stock: product.stock });
    }

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ── GET /api/products/:id/logs ────────────────────────────────────────────────
exports.getInventoryLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.id })
      .populate('performedBy', 'name avatar')
      .sort('-createdAt')
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
