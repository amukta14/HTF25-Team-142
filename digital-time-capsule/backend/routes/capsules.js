const express = require('express');
const router = express.Router();
const Capsule = require('../models/Capsule');
const auth = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos allowed'));
    }
  }
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'time-capsules' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// ------------------- CREATE CAPSULE -------------------
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { title, content, unlockDate, tags, mood, type } = req.body;

    if (!title || !content || !unlockDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Title, content, and unlock date are required' 
      });
    }

    if (new Date(unlockDate) <= new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Unlock date must be in the future' 
      });
    }

    const encryptedContent = encrypt(content);
    const uploadedMedia = [];

    // Handle uploaded files
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        uploadedMedia.push({
          url: result.secure_url,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          publicId: result.public_id
        });
      }
    }

    // Parse mediaUrls from frontend if sent as string
    // Parse mediaUrls from frontend if sent as string
    let parsedMediaUrls = [];
    if (req.body.mediaUrls) {
      try {
        parsedMediaUrls = typeof req.body.mediaUrls === 'string'
          ? JSON.parse(req.body.mediaUrls.replace(/'/g, '"'))
          : req.body.mediaUrls;
      } catch (e) {
        console.warn('Failed to parse mediaUrls, ignoring invalid data');
        parsedMediaUrls = [];
      }
    }

    // Merge uploaded media and parsed media
    const finalMediaUrls = [...uploadedMedia, ...parsedMediaUrls];

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const capsule = new Capsule({
      user: req.userId,
      title,
      content: encryptedContent,
      type: type || (finalMediaUrls.length > 0 ? 'mixed' : 'text'),
      mediaUrls: finalMediaUrls,
      unlockDate: new Date(unlockDate),
      tags: parsedTags,
      mood: mood || 'reflective'
    });

    await capsule.save();

    res.status(201).json({
      success: true,
      message: 'Time capsule created successfully',
      capsule: {
        id: capsule._id,
        title: capsule.title,
        unlockDate: capsule.unlockDate,
        isLocked: capsule.isLocked,
        type: capsule.type,
        mood: capsule.mood,
        tags: capsule.tags,
        createdAt: capsule.createdAt
      }
    });
  } catch (error) {
    console.error('Create capsule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- GET ALL CAPSULES -------------------
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.userId };
    
    if (status === 'locked') query.isLocked = true;
    else if (status === 'unlocked') query.isLocked = false;

    const capsules = await Capsule.find(query).sort({ createdAt: -1 }).select('-content');

    res.json({ success: true, capsules });
  } catch (error) {
    console.error('Get capsules error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- GET CAPSULE BY ID -------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const capsule = await Capsule.findOne({ _id: req.params.id, user: req.userId });

    if (!capsule) {
      return res.status(404).json({ success: false, message: 'Capsule not found' });
    }

    if (capsule.isLocked && new Date(capsule.unlockDate) > new Date()) {
      return res.json({
        success: true,
        capsule: {
          id: capsule._id,
          title: capsule.title,
          unlockDate: capsule.unlockDate,
          isLocked: capsule.isLocked,
          type: capsule.type,
          mood: capsule.mood,
          tags: capsule.tags,
          createdAt: capsule.createdAt,
          content: null,
          mediaUrls: []
        }
      });
    }

    const decryptedContent = decrypt(capsule.content);

    if (!capsule.isOpened) {
      capsule.isOpened = true;
      capsule.openedAt = new Date();
      await capsule.save();
    }

    res.json({
      success: true,
      capsule: {
        id: capsule._id,
        title: capsule.title,
        content: decryptedContent,
        type: capsule.type,
        mediaUrls: capsule.mediaUrls,
        unlockDate: capsule.unlockDate,
        isLocked: capsule.isLocked,
        isOpened: capsule.isOpened,
        openedAt: capsule.openedAt,
        mood: capsule.mood,
        tags: capsule.tags,
        createdAt: capsule.createdAt
      }
    });
  } catch (error) {
    console.error('Get capsule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- DELETE CAPSULE -------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const capsule = await Capsule.findOne({ _id: req.params.id, user: req.userId });

    if (!capsule) {
      return res.status(404).json({ success: false, message: 'Capsule not found' });
    }

    if (capsule.mediaUrls?.length > 0) {
      for (const media of capsule.mediaUrls) {
        if (media.publicId) {
          await cloudinary.uploader.destroy(media.publicId);
        }
      }
    }

    await Capsule.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Capsule deleted successfully' });
  } catch (error) {
    console.error('Delete capsule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- DASHBOARD STATS -------------------
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const totalCapsules = await Capsule.countDocuments({ user: req.userId });
    const lockedCapsules = await Capsule.countDocuments({ user: req.userId, isLocked: true });
    const unlockedCapsules = await Capsule.countDocuments({ user: req.userId, isLocked: false });
    const openedCapsules = await Capsule.countDocuments({ user: req.userId, isOpened: true });

    const nextCapsule = await Capsule.findOne({
      user: req.userId,
      isLocked: true
    }).sort({ unlockDate: 1 }).select('title unlockDate');

    res.json({
      success: true,
      stats: {
        totalCapsules,
        lockedCapsules,
        unlockedCapsules,
        openedCapsules,
        nextCapsule
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- EMOTION TIMELINE -------------------
router.get('/analytics/emotion-timeline', auth, async (req, res) => {
  try {
    const capsules = await Capsule.find({ user: req.userId })
      .select('mood createdAt unlockDate isOpened')
      .sort({ createdAt: 1 });

    const moodCounts = {};
    const timeline = [];
    
    capsules.forEach(capsule => {
      moodCounts[capsule.mood] = (moodCounts[capsule.mood] || 0) + 1;
      timeline.push({
        date: capsule.createdAt,
        mood: capsule.mood,
        isOpened: capsule.isOpened
      });
    });

    const moodTrends = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: ((count / capsules.length) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        timeline,
        moodTrends,
        totalCapsules: capsules.length
      }
    });
  } catch (error) {
    console.error('Get emotion timeline error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
