const PurchaseOrder = require('../models/PurchaseOrder');
const Product       = require('../models/Product');
const InventoryLog  = require('../models/InventoryLog');
const Notification  = require('../models/Notification');

const populate = [
  { path: 'supplier',      select: 'name contactPerson phone email gstNumber' },
  { path: 'items.product', select: 'name sku unit' },
  { path: 'createdBy',     select: 'name' },
];

// GET /api/purchase-orders
exports.getPOs = async (req, res, next) => {
  try {
    const { status, supplier, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (supplier) query.supplier = supplier;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query).populate(populate).sort(sort)
        .skip((page - 1) * Number(limit)).limit(Number(limit)),
      PurchaseOrder.countDocuments(query),
    ]);
    res.json({ success: true, data: orders, total });
  } catch (err) { next(err); }
};

// GET /api/purchase-orders/:id
exports.getPO = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id).populate(populate);
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// POST /api/purchase-orders
exports.createPO = async (req, res, next) => {
  try {
    // Snapshot product names/SKUs
    const itemsWithSnapshot = await Promise.all(
      req.body.items.map(async (item) => {
        const product = await Product.findById(item.product);
        return { ...item, name: product?.name || '', sku: product?.sku || '' };
      })
    );

    const po = await PurchaseOrder.create({
      ...req.body,
      items: itemsWithSnapshot,
      createdBy: req.user._id,
    });
    await po.populate(populate);
    req.io.emit('po:created', po);
    res.status(201).json({ success: true, data: po });
  } catch (err) { next(err); }
};

// PATCH /api/purchase-orders/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found.' });

    po.status = status;
    if (status === 'received') po.receivedDate = new Date();
    await po.save();

    // If fully received → add stock to inventory
    if (status === 'received') {
      for (const item of po.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        const before = product.stock;
        product.stock += item.quantity;
        await product.save();
        await InventoryLog.create({
          product: product._id, type: 'in', quantity: item.quantity,
          reason: 'Purchase Order received', reference: po.poNumber,
          stockBefore: before, stockAfter: product.stock, performedBy: req.user._id,
        });
      }

      // Notify
      const notif = await Notification.create({
        title: 'Purchase Order Received',
        message: `${po.poNumber} has been received. Inventory updated.`,
        type: 'success', category: 'order', isGlobal: true,
        refId: po._id, refModel: 'PurchaseOrder', createdBy: req.user._id,
      });
      req.io.emit('notification:new', notif);
    }

    await po.populate(populate);
    req.io.emit('po:updated', po);
    res.json({ success: true, data: po });
  } catch (err) { next(err); }
};

// PATCH /api/purchase-orders/:id/receive  (partial receive)
exports.receiveItems = async (req, res, next) => {
  try {
    const { items } = req.body;  // [{ product, receivedQty }]
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found.' });

    let totalReceived = 0;
    let totalOrdered  = 0;

    for (const incoming of items) {
      const poItem = po.items.find(i => String(i.product) === String(incoming.product));
      if (!poItem) continue;

      const qty = Number(incoming.receivedQty);
      poItem.receivedQty = (poItem.receivedQty || 0) + qty;
      totalReceived += poItem.receivedQty;
      totalOrdered  += poItem.quantity;

      // Update inventory
      const product = await Product.findById(incoming.product);
      if (product) {
        const before = product.stock;
        product.stock += qty;
        await product.save();
        await InventoryLog.create({
          product: product._id, type: 'in', quantity: qty,
          reason: 'Partial PO receipt', reference: po.poNumber,
          stockBefore: before, stockAfter: product.stock, performedBy: req.user._id,
        });
      }
    }

    po.status = totalReceived >= totalOrdered ? 'received' : 'partial';
    if (po.status === 'received') po.receivedDate = new Date();
    await po.save();
    await po.populate(populate);

    res.json({ success: true, data: po });
  } catch (err) { next(err); }
};

// DELETE /api/purchase-orders/:id
exports.deletePO = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found.' });
    if (!['draft', 'cancelled'].includes(po.status))
      return res.status(400).json({ success: false, message: 'Can only delete draft or cancelled POs.' });
    await po.deleteOne();
    res.json({ success: true, message: 'Purchase order deleted.' });
  } catch (err) { next(err); }
};
