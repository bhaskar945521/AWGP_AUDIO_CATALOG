/**
 * Role-based access control middleware.
 * Usage: roleCheck(['admin']) or roleCheck(['admin', 'user'])
 */
module.exports = function (allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied: insufficient role' });
  };
};
