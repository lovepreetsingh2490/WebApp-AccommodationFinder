const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const getSecret = () => process.env.JWT_SECRET || 'dev_secret_change_me';

/** Verify the Bearer token and attach the user id to the request. */
const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, getSecret());

    if (!decoded.id) {
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = { id: user._id, role: user.role, name: user.name, email: user.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

/** Only allow users with the admin role. Must be used after protect. */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

/**
 * Attach the user when a valid token is present, but allow the request to
 * continue when it is not. Used on the public enquiry route so we can link an
 * enquiry to a student's dashboard without forcing guests to register.
 */
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, getSecret());

      if (decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = { id: user._id, role: user.role, name: user.name, email: user.email };
        }
      }
    } catch {
      // Invalid/expired token: treat the submission as anonymous.
    }
  }

  return next();
};

module.exports = { protect, adminOnly, optionalAuth };
