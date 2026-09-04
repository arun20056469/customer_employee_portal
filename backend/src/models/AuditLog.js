const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
