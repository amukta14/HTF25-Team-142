const express = require('express');
const router = express.Router();
const SharedCapsule = require('../models/SharedCapsule');
const Capsule = require('../models/Capsule');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { decrypt } = require('../utils/encryption');
const bcrypt = require('bcryptjs');

// Share a capsule
router.post('/', auth, async (req, res) => {
  try {
    const { capsuleId, recipientEmail, message, deliveryDate, conditionalRules } = req.body;

    if (!capsuleId || !recipientEmail || !deliveryDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Capsule ID, recipient email, and delivery date are required' 
      });
    }

    if (new Date(deliveryDate) <= new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Delivery date must be in the future' 
      });
    }

    const capsule = await Capsule.findOne({ _id: capsuleId, user: req.userId });
    if (!capsule) {
      return res.status(404).json({ success: false, message: 'Capsule not found' });
    }

    const recipientUser = await User.findOne({ email: recipientEmail });

    let processedRules = {};
    if (conditionalRules) {
      if (conditionalRules.requirePassword && conditionalRules.password) {
        processedRules.requirePassword = true;
        processedRules.password = await bcrypt.hash(conditionalRules.password, 10);
      }
      if (conditionalRules.requireMilestone && conditionalRules.milestoneDescription) {
        processedRules.requireMilestone = true;
        processedRules.milestoneDescription = conditionalRules.milestoneDescription;
        processedRules.isMilestoneCompleted = false;
      }
    }

    const sharedCapsule = new SharedCapsule({
      capsule: capsuleId,
      sender: req.userId,
      recipientEmail,
      recipientUser: recipientUser?._id,
      message,
      deliveryDate: new Date(deliveryDate),
      conditionalRules: processedRules
    });

    await sharedCapsule.save();

    res.status(201).json({
      success: true,
      message: 'Capsule shared successfully',
      accessCode: sharedCapsule.accessCode
    });
  } catch (error) {
    console.error('Share capsule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get sent shared capsules
router.get('/sent', auth, async (req, res) => {
  try {
    const sharedCapsules = await SharedCapsule.find({ sender: req.userId })
      .populate('capsule', 'title type')
      .sort({ createdAt: -1 });

    res.json({ success: true, sharedCapsules });
  } catch (error) {
    console.error('Get sent capsules error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get received shared capsules
router.get('/received', auth, async (req, res) => {
  try {
    const sharedCapsules = await SharedCapsule.find({ 
      recipientEmail: req.user.email,
      isDelivered: true 
    })
    .populate('sender', 'name email')
    .populate('capsule', 'title type')
    .sort({ deliveredAt: -1 });

    res.json({ success: true, sharedCapsules });
  } catch (error) {
    console.error('Get received capsules error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a shared capsule by accessCode
router.get('/:accessCode', async (req, res) => {
  try {
    const sharedCapsule = await SharedCapsule.findOne({ 
      accessCode: req.params.accessCode 
    })
    .populate('sender', 'name email')
    .populate('capsule');

    if (!sharedCapsule) {
      return res.status(404).json({ success: false, message: 'Shared capsule not found' });
    }

    // Always return metadata
    const response = {
      success: true,
      sharedCapsule: {
        id: sharedCapsule._id,
        sender: sharedCapsule.sender,
        message: sharedCapsule.message,
        deliveredAt: sharedCapsule.deliveredAt,
        isOpened: sharedCapsule.isOpened,
        conditionalRules: {
          requirePassword: sharedCapsule.conditionalRules.requirePassword,
          requireMilestone: sharedCapsule.conditionalRules.requireMilestone,
          milestoneDescription: sharedCapsule.conditionalRules.milestoneDescription,
          isMilestoneCompleted: sharedCapsule.conditionalRules.isMilestoneCompleted
        },
        capsule: null // will populate only if allowed
      }
    };

    const canView = sharedCapsule.isDelivered &&
                    (!sharedCapsule.conditionalRules.requirePassword) && 
                    (!sharedCapsule.conditionalRules.requireMilestone || 
                     sharedCapsule.conditionalRules.isMilestoneCompleted);

    if (canView && sharedCapsule.capsule) {
      const decryptedContent = decrypt(sharedCapsule.capsule.content);
      response.sharedCapsule.capsule = {
        title: sharedCapsule.capsule.title,
        content: decryptedContent,
        type: sharedCapsule.capsule.type,
        mediaUrls: sharedCapsule.capsule.mediaUrls,
        mood: sharedCapsule.capsule.mood,
        tags: sharedCapsule.capsule.tags,
        createdAt: sharedCapsule.capsule.createdAt
      };

      if (!sharedCapsule.isOpened) {
        sharedCapsule.isOpened = true;
        sharedCapsule.openedAt = new Date();
        await sharedCapsule.save();
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Get shared capsule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify password to unlock capsule
router.post('/:accessCode/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const sharedCapsule = await SharedCapsule.findOne({ 
      accessCode: req.params.accessCode 
    }).populate('capsule');

    if (!sharedCapsule) {
      return res.status(404).json({ success: false, message: 'Shared capsule not found' });
    }

    if (!sharedCapsule.conditionalRules.requirePassword) {
      return res.status(400).json({ success: false, message: 'No password required' });
    }

    const isMatch = await bcrypt.compare(password, sharedCapsule.conditionalRules.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const decryptedContent = decrypt(sharedCapsule.capsule.content);

    if (!sharedCapsule.isOpened) {
      sharedCapsule.isOpened = true;
      sharedCapsule.openedAt = new Date();
      await sharedCapsule.save();
    }

    res.json({
      success: true,
      capsule: {
        title: sharedCapsule.capsule.title,
        content: decryptedContent,
        type: sharedCapsule.capsule.type,
        mediaUrls: sharedCapsule.capsule.mediaUrls,
        mood: sharedCapsule.capsule.mood,
        tags: sharedCapsule.capsule.tags,
        createdAt: sharedCapsule.capsule.createdAt
      }
    });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Complete milestone to unlock capsule
router.post('/:accessCode/complete-milestone', async (req, res) => {
  try {
    const sharedCapsule = await SharedCapsule.findOne({ 
      accessCode: req.params.accessCode 
    }).populate('capsule');

    if (!sharedCapsule) {
      return res.status(404).json({ success: false, message: 'Shared capsule not found' });
    }

    if (!sharedCapsule.conditionalRules.requireMilestone) {
      return res.status(400).json({ success: false, message: 'No milestone required' });
    }

    sharedCapsule.conditionalRules.isMilestoneCompleted = true;
    await sharedCapsule.save();

    const decryptedContent = decrypt(sharedCapsule.capsule.content);

    if (!sharedCapsule.isOpened) {
      sharedCapsule.isOpened = true;
      sharedCapsule.openedAt = new Date();
      await sharedCapsule.save();
    }

    res.json({
      success: true,
      message: 'Milestone completed! Capsule unlocked.',
      capsule: {
        title: sharedCapsule.capsule.title,
        content: decryptedContent,
        type: sharedCapsule.capsule.type,
        mediaUrls: sharedCapsule.capsule.mediaUrls,
        mood: sharedCapsule.capsule.mood,
        tags: sharedCapsule.capsule.tags,
        createdAt: sharedCapsule.capsule.createdAt
      }
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
