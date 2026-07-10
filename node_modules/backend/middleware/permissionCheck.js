// Check if user has the required permission(s)
module.exports = function (requiredPermissions) {
  return (req, res, next) => {
    // Admin always has full access
    if (req.user.role === 'admin') {
      return next();
    }

    // If no permissions required, proceed
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions && req.user.permissions.includes(permission)
    );

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};
