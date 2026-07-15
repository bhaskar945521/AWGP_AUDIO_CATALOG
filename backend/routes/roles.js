const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const auth = require('../middleware/auth');
const permissionCheck = require('../middleware/permissionCheck');
const { logAudit } = require('../utils/auditLogger');

// GET all roles (admin or roles_read permission)
router.get('/', auth, permissionCheck(['roles_read']), async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE dynamic role
router.post('/', auth, permissionCheck(['roles_create']), async (req, res) => {
  const { name, displayName, permissions, enabled } = req.body;
  if (!name || !displayName) {
    return res.status(400).json({ message: 'Role Name and Display Name are required' });
  }

  const roleName = name.trim().toLowerCase();

  try {
    const existing = await Role.findOne({ name: roleName });
    if (existing) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    const newRole = new Role({
      name: roleName,
      displayName: displayName.trim(),
      permissions: permissions || [],
      enabled: enabled !== undefined ? enabled : true,
      isSystem: false
    });

    await newRole.save();
    await logAudit(req, {
      module: 'roles',
      action: 'create',
      previousData: null,
      updatedData: newRole
    });

    res.status(201).json(newRole);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE dynamic role
router.put('/:id', auth, permissionCheck(['roles_update']), async (req, res) => {
  const { displayName, permissions, enabled } = req.body;

  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem && role.name === 'admin') {
      return res.status(403).json({ message: 'Core admin system role permissions cannot be modified.' });
    }

    const previousData = role.toObject();

    if (displayName) role.displayName = displayName.trim();
    if (permissions !== undefined) role.permissions = permissions;
    if (enabled !== undefined) role.enabled = enabled;

    await role.save();
    await logAudit(req, {
      module: 'roles',
      action: 'update',
      previousData,
      updatedData: role
    });

    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE dynamic role
router.delete('/:id', auth, permissionCheck(['roles_delete']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: 'System protected roles cannot be deleted' });
    }

    // Check if any user is currently assigned to this role
    const usersCount = await User.countDocuments({ role: role.name });
    if (usersCount > 0) {
      return res.status(400).json({ message: `Cannot delete role. It is currently assigned to ${usersCount} users.` });
    }

    const previousData = role.toObject();
    await Role.findByIdAndDelete(req.params.id);

    await logAudit(req, {
      module: 'roles',
      action: 'delete',
      previousData,
      updatedData: null
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
