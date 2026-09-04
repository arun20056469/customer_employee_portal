const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['read', 'write', 'delete', 'manage'],
    default: 'read'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate resource-action pairs
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
