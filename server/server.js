require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Express routes
app.use('/api/centers', require('./routes/centerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Accommodation Finder API running',
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// When a production client build exists, serve it alongside the API
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Centralised error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start server:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
