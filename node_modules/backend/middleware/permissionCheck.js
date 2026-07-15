function mapPermission(oldPermission) {
  const mapping = {
    'audio_view': 'audios_read',
    'audios_view': 'audios_read',
    'audio_upload': 'audios_create',
    'audio_edit': 'audios_update',
    'audio_delete': 'audios_delete',
    
    'category_view': 'categories_read',
    'categories_view': 'categories_read',
    'category_create': 'categories_create',
    'category_edit': 'categories_update',
    'category_delete': 'categories_delete',
    
    'album_view': 'albums_read',
    'albums_view': 'albums_read',
    'album_create': 'albums_create',
    'album_edit': 'albums_update',
    'album_delete': 'albums_delete',
    
    'feedback_view': 'feedback_read',
    'feedback_delete': 'feedback_delete',
    
    'analytics_view': 'logs_read',
    'users_manage': 'users_read',
    'settings_manage': 'settings_update',
    'admin_settings_manage': 'settings_update'
  };
  return mapping[oldPermission] || oldPermission;
}

function expandPermissions(permsList) {
  if (!permsList || !Array.isArray(permsList)) return [];
  const expanded = new Set(permsList);
  const mapping = {
    'audio_view': 'audios_read',
    'audios_view': 'audios_read',
    'audio_upload': 'audios_create',
    'audio_edit': 'audios_update',
    'audio_delete': 'audios_delete',
    
    'category_view': 'categories_read',
    'categories_view': 'categories_read',
    'category_create': 'categories_create',
    'category_edit': 'categories_update',
    'category_delete': 'categories_delete',
    
    'album_view': 'albums_read',
    'albums_view': 'albums_read',
    'album_create': 'albums_create',
    'album_edit': 'albums_update',
    'album_delete': 'albums_delete',
    
    'feedback_view': 'feedback_read',
    'feedback_delete': 'feedback_delete',
    
    'analytics_view': 'logs_read',
    'users_manage': 'users_read',
    'settings_manage': 'settings_update',
    'admin_settings_manage': 'settings_update'
  };
  
  permsList.forEach(p => {
    // Add forward mapping (legacy -> standard)
    if (mapping[p]) {
      expanded.add(mapping[p]);
    }
    // Add reverse mapping (standard -> legacy)
    for (const [legacy, standard] of Object.entries(mapping)) {
      if (p === standard) {
        expanded.add(legacy);
      }
    }
  });
  
  return Array.from(expanded);
}

// Check if user has the required permission(s)
const checkPermission = function (requiredPermissions) {
  return (req, res, next) => {
    // Admin always has full access
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // If no permissions required, proceed
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }

    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Check if user has any of the required permissions (directly or mapped)
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission) ||
      req.user.permissions.includes(mapPermission(permission))
    );

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};

module.exports = checkPermission;
module.exports.expandPermissions = expandPermissions;
module.exports.mapPermission = mapPermission;

