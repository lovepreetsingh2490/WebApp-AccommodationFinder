const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Enquiry = require('../models/enquiryModel');
const Center = require('../models/centerModel');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/enquiries - any visitor can ask about an accommodation
router.post('/', optionalAuth, [
  body('center').isMongoId().withMessage('A valid accommodation is required'),
  body('name').notEmpty().withMessage('Your name is required').trim(),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('message').notEmpty().withMessage('A message is required').trim().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const center = await Center.findById(req.body.center).select('name');
    if (!center) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }

    const enquiry = await Enquiry.create({
      center: center._id,
      centerName: center.name,
      // Link to the student account when they were logged in.
      ...(req.user ? { user: req.user.id } : {}),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      purpose: ['booking', 'waitlist'].includes(req.body.purpose) ? req.body.purpose : 'booking',
      message: req.body.message,
    });

    return res.status(201).json(enquiry);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/enquiries/mine - enquiries belonging to the logged-in student.
// Declared before the admin-only middleware so ordinary students can read it.
// Enquiries submitted as a guest are matched by email once that person logs in.
router.get('/mine', protect, async (req, res) => {
  try {
    const email = String(req.user.email || '').trim().toLowerCase();
    const query = email
      ? {
          $or: [
            { user: req.user.id },
            { user: { $exists: false }, email },
          ],
        }
      : { user: req.user.id };

    const enquiries = await Enquiry.find(query)
      .populate('center', 'name location pricePerWeek type')
      .sort({ createdAt: -1 });

    return res.json(enquiries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Everything below is admin-only.
router.use(protect, adminOnly);

// GET /api/enquiries - all enquiries, newest first
router.get('/', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().populate('center', 'name').sort({ createdAt: -1 });
    return res.json(enquiries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/enquiries/:id/status - update enquiry status
router.patch('/:id/status', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const { status } = req.body;
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    return res.json(enquiry);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
