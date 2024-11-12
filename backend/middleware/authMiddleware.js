const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming you have a User model

const authMiddleware = (roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      if (!token) {
        return res.status(403).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user = user; // Attach user to the request
      if (roles && roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

module.exports = authMiddleware;
