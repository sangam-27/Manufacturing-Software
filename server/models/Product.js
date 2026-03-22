const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Product name is required'], trim: true },
    sku:         { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
    category:    { type: String, required: [true, 'Category is required'] },
    description: { type: String, default: '' },
    stock:       { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    minStock:    { type: Number, required: true, default: 10 },
    price:       { type: Number, required: [true, 'Price is required'], min: 0 },
    unit:        { type: String, default: 'pcs' },
    status:      { type: String, enum: ['active', 'low_stock', 'out_of_stock'], default: 'active' },
    images:      [{ type: String }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Auto-update status based on stock level ──────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.stock === 0)                  this.status = 'out_of_stock';
  else if (this.stock < this.minStock)   this.status = 'low_stock';
  else                                   this.status = 'active';
  next();
});

// ── Index for fast search ────────────────────────────────────────────────────
productSchema.index({ name: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);
