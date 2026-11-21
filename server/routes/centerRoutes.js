const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Center = require('../models/centerModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Only these fields may be used for sorting - prevents arbitrary sort injection.
const SORT_FIELDS = new Set(['pricePerWeek', 'rating', 'createdAt', 'distanceToCampus', 'name']);

const toNumber = (value, fallback) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build the MongoDB filter from query-string parameters. */
const buildFilter = (query) => {
  const {
    search = '',
    city = '',
    type = '',
    minPrice = 0,
    maxPrice = 999999,
    amenities = '',
    available = '',
    maxDistance = '',
    minRating = '',
  } = query;

  const filter = {};

  if (search) {
    filter.$text = { $search: String(search) };
  }

  if (city) {
    filter['location.city'] = new RegExp(escapeRegExp(city), 'i');
  }

  if (type) {
    filter.type = type;
  }

  const min = Math.max(0, toNumber(minPrice, 0));
  const max = Math.max(min, toNumber(maxPrice, 999999));
  filter.pricePerWeek = { $gte: min, $lte: max };

  if (amenities) {
    const amenityList = String(amenities)
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (amenityList.length > 0) {
      filter.amenities = { $all: amenityList };
    }
  }

  if (available === 'true' || available === 'false') {
    filter.available = available === 'true';
  }

  const maxDistanceNumber = toNumber(maxDistance, NaN);
  if (Number.isFinite(maxDistanceNumber)) {
    filter.distanceToCampus = { $lte: Math.max(0, maxDistanceNumber) };
  }

  const minRatingNumber = toNumber(minRating, NaN);
  if (Number.isFinite(minRatingNumber)) {
    filter.rating = { $gte: Math.min(5, Math.max(0, minRatingNumber)) };
  }

  return filter;
};

// GET /api/centers/filters/options - distinct values for the filter UI.
// NOTE: declared before /:id so Express does not treat "filters" as an id.
router.get('/filters/options', async (req, res) => {
  try {
    const [cities, types, amenities] = await Promise.all([
      Center.distinct('location.city'),
      Center.distinct('type'),
      Center.distinct('amenities'),
    ]);

    res.json({ cities, types, amenities: amenities.sort() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/centers/stats - real numbers for the homepage statistics.
router.get('/stats', async (req, res) => {
  try {
    const [aggregate] = await Center.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: { $sum: { $cond: ['$available', 1, 0] } },
          verified: { $sum: { $cond: ['$verified', 1, 0] } },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const [cities, countries] = await Promise.all([
      Center.distinct('location.city'),
      Center.distinct('location.country'),
    ]);

    res.json({
      total: aggregate?.total || 0,
      available: aggregate?.available || 0,
      verified: aggregate?.verified || 0,
      averageRating: Number((aggregate?.averageRating || 0).toFixed(1)),
      cities: cities.length,
      countries: countries.length,
      cityList: cities.sort(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/centers - list with filtering, sorting, search and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = buildFilter(req.query);
    const safeSortBy = SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    const sort = { [safeSortBy]: order === 'asc' ? 1 : -1 };

    const pageNumber = Math.max(1, Math.floor(toNumber(page, 1)));
    const limitNumber = Math.min(100, Math.max(1, Math.floor(toNumber(limit, 12))));
    const skip = (pageNumber - 1) * limitNumber;

    const [centers, total] = await Promise.all([
      Center.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Center.countDocuments(filter),
    ]);

    res.json({
      centers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/centers/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Center not found' });
    }

    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }

    return res.json(center);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Validation rules shared by create and update.
const centerValidation = [
  body('name').optional({ nullable: true }).notEmpty().withMessage('Center name is required').trim(),
  body('pricePerWeek').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location.address').optional({ nullable: true }).notEmpty().withMessage('Address is required').trim(),
  body('location.city').optional({ nullable: true }).notEmpty().withMessage('City is required').trim(),
  body('location.country').optional({ nullable: true }).notEmpty().withMessage('Country is required').trim(),
];

// POST /api/centers (admin only)
router.post('/', protect, adminOnly, centerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const center = await Center.create(req.body);
    return res.status(201).json(center);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/centers/:id (admin only)
router.put('/:id', protect, adminOnly, centerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Center not found' });
    }

    const center = await Center.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }

    return res.json(center);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/centers/:id (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Center not found' });
    }

    const center = await Center.findByIdAndDelete(req.params.id);
    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }

    return res.json({ message: 'Center deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
