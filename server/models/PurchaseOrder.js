const mongoose = require('mongoose');
const Counter  = require('./Counter');

const poItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:         { type: String },
  sku:          { type: String },
  quantity:     { type: Number, required: true, min: 1 },
  unitPrice:    { type: Number, required: true, min: 0 },
  receivedQty:  { type: Number, default: 0 },
  total:        { type: Number },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber:     { type: String, unique: true },
    supplier:     { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items:        { type: [poItemSchema], validate: v => v.length > 0 },
    subtotal:     { type: Number, default: 0 },
    gstRate:      { type: Number, default: 18 },
    gstAmount:    { type: Number, default: 0 },
    total:        { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partial', 'received', 'cancelled'],
      default: 'draft',
    },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    paymentStatus:{ type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    notes:        { type: String, default: '' },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Auto PO number + totals ────────────────────────────────────────────────
purchaseOrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'purchaseOrder' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.poNumber = `PO-BUY-${String(counter.seq).padStart(4, '0')}`;
  }
  this.items.forEach(item => { item.total = item.quantity * item.unitPrice; });
  this.subtotal  = this.items.reduce((s, i) => s + i.total, 0);
  this.gstAmount = parseFloat(((this.subtotal * this.gstRate) / 100).toFixed(2));
  this.total     = parseFloat((this.subtotal + this.gstAmount).toFixed(2));
  next();
});

purchaseOrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
