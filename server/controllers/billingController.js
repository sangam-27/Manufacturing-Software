const Sale         = require('../models/Sale');
const Product      = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

const populate = [
  { path: 'items.product', select: 'name sku' },
  { path: 'createdBy',     select: 'name' },
];

// ── GET /api/billing ──────────────────────────────────────────────────────────
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, client, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (client) query.client = { $regex: client, $options: 'i' };

    const [invoices, total] = await Promise.all([
      Sale.find(query).populate(populate).sort(sort).skip((page - 1) * Number(limit)).limit(Number(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({ success: true, data: invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── GET /api/billing/:id ──────────────────────────────────────────────────────
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Sale.findById(req.params.id).populate(populate);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// ── POST /api/billing ─────────────────────────────────────────────────────────
exports.createInvoice = async (req, res, next) => {
  try {
    // Snapshot product names/SKUs at time of sale
    const itemsWithSnapshot = await Promise.all(
      req.body.items.map(async (item) => {
        const product = await Product.findById(item.product);
        return {
          ...item,
          name:      product?.name || '',
          sku:       product?.sku  || '',
          unitPrice: item.unitPrice || product?.price || 0,
        };
      })
    );

    const sale = await Sale.create({ ...req.body, items: itemsWithSnapshot, createdBy: req.user._id });

    // Deduct stock for each item when not draft
    if (sale.status !== 'draft') {
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        const before   = product.stock;
        product.stock  = Math.max(0, product.stock - item.quantity);
        await product.save();
        await InventoryLog.create({
          product: product._id, type: 'out', quantity: item.quantity,
          reason: 'Sale', reference: sale.invoiceNumber,
          stockBefore: before, stockAfter: product.stock,
          performedBy: req.user._id,
        });
      }
    }

    await sale.populate(populate);
    req.io.emit('invoice:created', sale);
    res.status(201).json({ success: true, data: sale });
  } catch (err) { next(err); }
};

// ── PATCH /api/billing/:id/status ────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const prevStatus = sale.status;
    sale.status = status;

    // Deduct stock when moving from draft → pending/paid
    if (prevStatus === 'draft' && ['pending', 'paid'].includes(status)) {
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        const before  = product.stock;
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
        await InventoryLog.create({
          product: product._id, type: 'out', quantity: item.quantity,
          reason: 'Sale confirmed', reference: sale.invoiceNumber,
          stockBefore: before, stockAfter: product.stock, performedBy: req.user._id,
        });
      }
    }

    await sale.save();
    await sale.populate(populate);
    req.io.emit('invoice:updated', sale);
    res.json({ success: true, data: sale });
  } catch (err) { next(err); }
};

// ── DELETE /api/billing/:id ───────────────────────────────────────────────────
exports.deleteInvoice = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    if (!['draft', 'cancelled'].includes(sale.status)) {
      return res.status(400).json({ success: false, message: 'Can only delete draft or cancelled invoices.' });
    }
    await sale.deleteOne();
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (err) { next(err); }
};
