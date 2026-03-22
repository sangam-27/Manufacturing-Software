const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name:         { type: String, required: [true, 'Supplier name required'], trim: true },
    contactPerson:{ type: String, default: '' },
    email:        { type: String, default: '', lowercase: true, trim: true },
    phone:        { type: String, default: '' },
    address:      { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    gstNumber:    { type: String, default: '', uppercase: true },
    panNumber:    { type: String, default: '', uppercase: true },
    bankAccount:  { type: String, default: '' },
    bankIFSC:     { type: String, default: '' },
    bankName:     { type: String, default: '' },
    paymentTerms: { type: Number, default: 30 },   // days
    status:       { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'active' },
    rating:       { type: Number, min: 1, max: 5, default: 3 },
    notes:        { type: String, default: '' },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text', gstNumber: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
