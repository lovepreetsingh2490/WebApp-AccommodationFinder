const mongoose = require('mongoose');

/**
 * Connect to MongoDB. Keeping this in one place makes the connection
 * reusable by the API server and by any scripts that need the database.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accommodation_finder';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
