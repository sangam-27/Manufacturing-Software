const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  type:        { type: String, enum: ['preventive', 'corrective', 'breakdown'], required: true },
  description: { type: String, required: true },
  cost:        { type: Number, default: 0 },
  technician:  { type: String, default: '' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime:   { type: Date },
  endTime:     { type: Date },
  status:      { type: String, enum: ['scheduled', 'in_progress', 'done'], default: 'done' },
}, { timestamps: true });

const machineSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    machineId:       { type: String, unique: true, uppercase: true },
    category:        { type: String, default: '' },
    location:        { type: String, default: '' },
    manufacturer:    { type: String, default: '' },
    model:           { type: String, default: '' },
    serialNumber:    { type: String, default: '' },
    purchaseDate:    { type: Date },
    purchaseCost:    { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['operational', 'maintenance', 'breakdown', 'idle', 'decommissioned'],
      default: 'operational',
    },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    maintenanceIntervalDays: { type: Number, default: 30 },
    maintenanceLogs: [maintenanceLogSchema],
    assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes:           { type: String, default: '' },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate machineId
machineSchema.pre('save', async function (next) {
  if (this.isNew && !this.machineId) {
    const Counter = require('./Counter');
    const counter = await Counter.findOneAndUpdate(
      { name: 'machine' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.machineId = `MCH-${String(counter.seq).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Machine', machineSchema);
