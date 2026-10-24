const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify access token from cookies
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please login again.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please refresh.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }
};

// Role-based access control
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

module.exports = { authenticate, restrictTo };
