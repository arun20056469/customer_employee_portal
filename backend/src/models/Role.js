const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    enum: {
      values: ['Admin', 'HR', 'Sales', 'Support', 'Finance'],
      message: '{VALUE} is not a valid role'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  zohoApps: [{
    name: {
      type: String,
      required: true
    },
    serviceKey: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: '📱'
    },
    description: {
      type: String,
      default: ''
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
