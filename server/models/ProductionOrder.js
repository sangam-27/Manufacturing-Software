const mongoose = require('mongoose');
const Counter  = require('./Counter');

const timelineEventSchema = new mongoose.Schema(
  {
    stage:       { type: String, required: true },
    note:        { type: String, default: '' },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, _id: true }
);

const productionOrderSchema = new mongoose.Schema(
  {
    orderId:    { type: String, unique: true },
    product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity:   { type: Number, required: true, min: 1 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'on_hold', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority:  { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    progress:  { type: Number, default: 0, min: 0, max: 100 },
    dueDate:   { type: Date, required: true },
    notes:     { type: String, default: '' },
    timeline:  [timelineEventSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Auto-generate orderId ────────────────────────────────────────────────────
productionOrderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'productionOrder' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderId = `PO-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) { next(err); }
});

// ── Auto set status=completed when progress hits 100 ────────────────────────
productionOrderSchema.pre('save', function (next) {
  if (this.progress === 100) this.status = 'completed';
  next();
});

productionOrderSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);
