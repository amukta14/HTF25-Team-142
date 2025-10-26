const mongoose = require('mongoose');
const crypto = require('crypto');

const sharedCapsuleSchema = new mongoose.Schema({
  capsule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Capsule',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientEmail: {
    type: String,
    required: [true, 'Recipient email is required'],
    lowercase: true,
    trim: true
  },
  recipientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    default: ''
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required']
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  accessCode: {
    type: String,
    unique: true
  },
  isOpened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date
  },
  conditionalRules: {
    requirePassword: {
      type: Boolean,
      default: false
    },
    password: String,
    requireMilestone: {
      type: Boolean,
      default: false
    },
    milestoneDescription: String,
    isMilestoneCompleted: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

sharedCapsuleSchema.pre('save', function(next) {
  if (!this.accessCode) {
    this.accessCode = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('SharedCapsule', sharedCapsuleSchema);