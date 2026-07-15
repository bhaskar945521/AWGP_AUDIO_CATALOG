const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    
    // Fetch latest user status and role dynamically
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }

    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: `Your account is ${user.status}. Access denied.` });
    }

    // Resolve permissions from Role document
    let permissions = [];
    if (user.role === 'admin') {
      permissions = ['admin'];
    } else {
      const roleDoc = await Role.findOne({ name: user.role });
      if (!roleDoc) {
        permissions = user.permissions || [];
      } else if (!roleDoc.enabled) {
        return res.status(403).json({ message: 'Role is disabled. Access denied.' });
      } else {
        permissions = roleDoc.permissions || [];
      }
    }

    req.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      permissions: permissions,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
