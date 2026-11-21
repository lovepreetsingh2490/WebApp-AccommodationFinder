const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    enum: ['University Hall', 'Private Hostel', 'Shared Apartment', 'Studio', 'Homestay'],
    default: 'Private Hostel',
  },
  location: {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  pricePerWeek: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'GBP',
  },
  roomTypes: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    available: { type: Number, default: 0 },
  }],
  amenities: [{
    type: String,
    enum: [
      'WiFi', 'Laundry', 'Kitchen', 'Furnished', 'Study Area',
      'Gym', 'Common Room', 'Security', 'Parking', 'Garden',
      'Bicycle Storage', 'Cafeteria', 'Cleaning Service', 'Air Conditioning',
    ],
  }],
  facilities: [{ type: String, trim: true }],
  maxOccupancy: {
    type: Number,
    default: 1,
    min: 1,
  },
  minimumStayWeeks: {
    type: Number,
    default: 52,
    min: 1,
  },
  distanceToCampus: {
    type: Number, // in km
    min: 0,
  },
  transportOptions: [{ type: String, trim: true }],
  available: {
    type: Boolean,
    default: true,
  },
  verified: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  images: [{ type: String }],
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  policies: {
    acceptsVisaProof: { type: Boolean, default: false },
    acceptsGuarantor: { type: Boolean, default: false },
    studentOnly: { type: Boolean, default: false },
    billsIncluded: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Text index for search
centerSchema.index({ name: 'text', description: 'text', 'location.address': 'text' });
centerSchema.index({ 'location.city': 1 });
centerSchema.index({ pricePerWeek: 1 });
centerSchema.index({ type: 1 });
centerSchema.index({ available: 1 });
centerSchema.index({ verified: 1 });
centerSchema.index({ rating: -1 });

module.exports = mongoose.model('Center', centerSchema);