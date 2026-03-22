const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email:      { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:   { type: String, required: [true, 'Password is required'], select: false, minlength: 6 },
    role:       { type: String, enum: ['admin', 'supervisor', 'user'], default: 'user' },
    department: { type: String, default: '' },
    avatar:     { type: String, default: '' },    // initials or URL
    status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin:  { type: Date },
  },
  { timestamps: true }
);

// ── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Auto-generate avatar initials
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  next();
});

// ── Instance method: compare password ───────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ── Hide password in JSON ────────────────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
