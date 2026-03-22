const mongoose = require('mongoose');
const Counter  = require('./Counter');

const lineItemSchema = new mongoose.Schema(
  {
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String },           // snapshot at time of sale
    sku:       { type: String },
    quantity:  { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total:     { type: Number },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    client:        { type: String, required: [true, 'Client name is required'], trim: true },
    clientGST:     { type: String, default: '' },
    clientAddress: { type: String, default: '' },
    items:         { type: [lineItemSchema], validate: v => v.length > 0 },
    subtotal:      { type: Number, default: 0 },
    gstRate:       { type: Number, default: 18 },
    gstAmount:     { type: Number, default: 0 },
    total:         { type: Number, default: 0 },
    status:        { type: String, enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'], default: 'draft' },
    dueDate:       { type: Date },
    paidAt:        { type: Date },
    notes:         { type: String, default: '' },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Auto invoice number + calculate totals ───────────────────────────────────
saleSchema.pre('save', async function (next) {
  // Invoice number
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'invoice' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.invoiceNumber = `INV-${String(counter.seq + 999).padStart(4, '0')}`;
  }
  // Totals
  this.subtotal  = this.items.reduce((s, i) => { i.total = i.quantity * i.unitPrice; return s + i.total; }, 0);
  this.gstAmount = parseFloat(((this.subtotal * this.gstRate) / 100).toFixed(2));
  this.total     = parseFloat((this.subtotal + this.gstAmount).toFixed(2));

  // Auto-mark paid
  if (this.status === 'paid' && !this.paidAt) this.paidAt = new Date();
  next();
});

saleSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
