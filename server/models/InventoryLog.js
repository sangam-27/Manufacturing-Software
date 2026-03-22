const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type:        { type: String, enum: ['in', 'out', 'adjustment'], required: true },
    quantity:    { type: Number, required: true },
    reason:      { type: String, default: '' },
    reference:   { type: String, default: '' },   // Invoice/Order ID
    stockBefore: { type: Number },
    stockAfter:  { type: Number },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
