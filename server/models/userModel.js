const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  preferences: {
    budget: { type: Number, default: 0 },
    preferredCities: [{ type: String }],
    requiredAmenities: [{ type: String }],
    preferredType: { type: String, default: '' },
    maxDistanceToCampus: { type: Number, default: 10 },
  },
  savedCenters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);