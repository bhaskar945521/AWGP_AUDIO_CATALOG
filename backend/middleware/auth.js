const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { expandPermissions } = require('./permissionCheck');

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

    // Resolve permissions:
    // If role is admin, they have admin role bypass.
    // Otherwise, check if role doc is enabled (Access Denied if disabled).
    // IMPORTANT: user.permissions is the STRICT source of truth for non-admin users.
    // An empty array [] means "no permissions granted" — do NOT fall back to role permissions.
    // Only fall back to role permissions if user.permissions is null/undefined (truly uninitialized/legacy user).
    let permissions = [];
    if (user.role === 'admin') {
      permissions = ['admin'];
    } else {
      const roleDoc = await Role.findOne({ name: user.role });
      if (roleDoc && !roleDoc.enabled) {
        return res.status(403).json({ message: 'Role is disabled. Access denied.' });
      }
      if (user.permissions !== null && user.permissions !== undefined) {
        // Use exactly what was assigned to this user (even if empty = no permissions)
        permissions = user.permissions;
      } else if (roleDoc) {
        // Legacy uninitialized user: fall back to role defaults
        permissions = roleDoc.permissions || [];
      } else {
        permissions = [];
      }
    }

    req.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      permissions: expandPermissions(permissions),
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
