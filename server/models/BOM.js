const mongoose = require('mongoose');

const bomComponentSchema = new mongoose.Schema({
  material:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String },
  sku:         { type: String },
  quantity:    { type: Number, required: true, min: 0.001 },
  unit:        { type: String, default: 'pcs' },
  scrapFactor: { type: Number, default: 0 },  // % waste
  notes:       { type: String, default: '' },
}, { _id: false });

const bomSchema = new mongoose.Schema(
  {
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    version:     { type: String, default: '1.0' },
    components:  { type: [bomComponentSchema], validate: v => v.length > 0 },
    laborHours:  { type: Number, default: 0 },
    laborCost:   { type: Number, default: 0 },
    overheadPct: { type: Number, default: 10 },  // overhead %
    totalMaterialCost: { type: Number, default: 0 },
    totalCost:   { type: Number, default: 0 },
    status:      { type: String, enum: ['draft', 'active', 'obsolete'], default: 'active' },
    notes:       { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BOM', bomSchema);
