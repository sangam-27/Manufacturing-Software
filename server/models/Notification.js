const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    type:     { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
    category: { type: String, enum: ['stock', 'order', 'invoice', 'task', 'maintenance', 'shift', 'system'], default: 'system' },
    link:     { type: String, default: '' },      // frontend route
    refId:    { type: mongoose.Schema.Types.ObjectId },
    refModel: { type: String, default: '' },
    // Delivery
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // empty = broadcast all
    readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGlobal: { type: Boolean, default: false },  // show to all users
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
