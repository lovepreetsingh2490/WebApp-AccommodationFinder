const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true,
  },
  // Set when a logged-in student submits the enquiry so it appears on their
  // dashboard. Guests can still enquire; those records are matched by email
  // later if the guest registers with the same address.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  centerName: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Your name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Your email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  purpose: {
    type: String,
    enum: ['booking', 'waitlist'],
    default: 'booking',
  },
  message: {
    type: String,
    required: [true, 'A message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
  },
}, { timestamps: true });

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ user: 1, createdAt: -1 });
enquirySchema.index({ email: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
