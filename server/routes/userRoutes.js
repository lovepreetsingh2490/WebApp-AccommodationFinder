const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: '7d',
  });

const PREFERENCE_FIELDS = [
  'budget',
  'preferredCities',
  'requiredAmenities',
  'preferredType',
  'maxDistanceToCampus',
];

/** Whitelist preference fields so clients cannot write arbitrary document paths. */
const sanitizePreferences = (input = {}) => {
  const preferences = {};

  PREFERENCE_FIELDS.forEach((field) => {
    if (!(field in input)) return;

    if (field === 'budget' || field === 'maxDistanceToCampus') {
      const number = Number(input[field]);
      preferences[field] = Number.isFinite(number) ? number : 0;
    } else if (field === 'preferredCities' || field === 'requiredAmenities') {
      preferences[field] = Array.isArray(input[field])
        ? input[field].filter((value) => typeof value === 'string' && value.trim())
        : [];
    } else {
      preferences[field] = String(input[field] || '');
    }
  });

  return preferences;
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  preferences: user.preferences,
  savedCenters: user.savedCenters,
  token: generateToken(user._id),
});

// POST /api/users/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, preferences } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      ...(preferences ? { preferences: sanitizePreferences(preferences) } : {}),
    });

    await user.save();
    return res.status(201).json(publicUser(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post('/login', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    return res.json(publicUser(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// All routes below this point require a valid token.
router.use(protect);

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/preferences
router.put('/preferences', async (req, res) => {
  try {
    const preferences = sanitizePreferences(req.body);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/profile - let students update their own name
router.put('/profile', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/users/saved - saved centres with full details
router.get('/saved', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedCenters');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user.savedCenters);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/saved/:centerId - toggle a saved accommodation
router.post('/saved/:centerId', async (req, res) => {
  const { centerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(centerId)) {
    return res.status(400).json({ error: 'Invalid accommodation id' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadySaved = user.savedCenters.some((id) => id.toString() === centerId);

    await User.findByIdAndUpdate(
      req.user.id,
      alreadySaved
        ? { $pull: { savedCenters: centerId } }
        : { $addToSet: { savedCenters: centerId } }
    );

    const savedCenters = alreadySaved
      ? user.savedCenters.filter((id) => id.toString() !== centerId)
      : [...user.savedCenters, centerId];

    return res.json({ saved: savedCenters, isSaved: !alreadySaved });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
