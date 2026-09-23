const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    name: {
      type: String,
      default: 'ERP User',
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'user', 'owner', 'purchase_manager'],
      default: 'user',
    },
    department: {
      type: String,
      enum: ['all', 'accounts', 'logistics', 'store', 'production', 'quality', 'sales', 'management', 'engineering', 'finance', 'operations', 'purchase'],
      default: 'all',
    },
    designation: {
      type: String,
      default: 'Staff',
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedModules: {
      type: [String],
      default: [],
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    hasAiAccess: {
      type: Boolean,
      default: false,
    },
    allowedAiActions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Extended HR fields
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    employeeId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
