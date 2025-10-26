const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'mixed'],
    default: 'text'
  },
  mediaUrls: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video", "audio", "other"], default: "image" },
      publicId: { type: String }
    }
  ],  
  unlockDate: {
    type: Date,
    required: [true, 'Unlock date is required']
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  tags: [String],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'nostalgic', 'hopeful', 'grateful', 'reflective', 'anxious', 'peaceful'],
    default: 'reflective'
  },
  isOpened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

capsuleSchema.index({ user: 1, createdAt: -1 });
capsuleSchema.index({ user: 1, unlockDate: 1 });
capsuleSchema.index({ unlockDate: 1, isLocked: 1 });

module.exports = mongoose.model('Capsule', capsuleSchema);