const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

async function logAudit(req, { module, action, previousData, updatedData }) {
  try {
    const userId = req.user?._id;
    let username = 'System';
    let role = 'System';

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        username = user.username;
        role = user.role;
      }
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Create Audit Log entry
    const audit = new AuditLog({
      user: username,
      userId,
      role,
      module,
      action: action.toLowerCase(),
      previousData: previousData ? JSON.parse(JSON.stringify(previousData)) : null,
      updatedData: updatedData ? JSON.parse(JSON.stringify(updatedData)) : null,
      ipAddress,
      userAgent
    });
    await audit.save();

    // Update User Activity score and counters in real time
    if (userId) {
      const updateFields = {
        lastActivity: new Date()
      };

      const actionLower = action.toLowerCase();
      if (actionLower === 'create') {
        updateFields.$inc = { createCount: 1, activityScore: 1 };
      } else if (actionLower === 'update' || actionLower === 'edit') {
        updateFields.$inc = { updateCount: 1, activityScore: 1 };
      } else if (actionLower === 'delete') {
        updateFields.$inc = { deleteCount: 1, activityScore: -1 };
      }

      await User.findByIdAndUpdate(userId, updateFields);
    }
  } catch (err) {
    console.error('[AuditLogger] Failed to log audit:', err);
  }
}

module.exports = { logAudit };
