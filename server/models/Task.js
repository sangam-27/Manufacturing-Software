const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Task title is required'], trim: true },
    description: { type: String, default: '' },
    order:       { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', default: null },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority:    { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status:      { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    dueDate:     { type: Date },
    completedAt: { type: Date },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.pre('save', function (next) {
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
