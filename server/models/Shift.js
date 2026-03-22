const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn:    { type: Date },
  checkOut:   { type: Date },
  hoursWorked:{ type: Number, default: 0 },
  overtime:   { type: Number, default: 0 },
  status:     { type: String, enum: ['present', 'absent', 'half_day', 'late'], default: 'present' },
  note:       { type: String, default: '' },
}, { _id: false });

const shiftSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },   // e.g. "Morning Shift"
    date:       { type: Date, required: true },
    startTime:  { type: String, required: true },               // "08:00"
    endTime:    { type: String, required: true },               // "16:00"
    department: { type: String, default: '' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendance: [attendanceSchema],
    status:     { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    notes:      { type: String, default: '' },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

shiftSchema.index({ date: -1, department: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
