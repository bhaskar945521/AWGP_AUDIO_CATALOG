const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const permissionCheck = require('../middleware/permissionCheck');

// ── GET Audit Logs (Paginated, Searchable) ────────────────────────────
// Strictly requires logs_read permission — analytics_view does NOT grant access to raw audit logs
router.get('/audit-logs', auth, permissionCheck(['logs_read']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = {};

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { user: searchRegex },
        { role: searchRegex },
        { module: searchRegex },
        { action: searchRegex }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'username fullName email'),
      AuditLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[Reports] Get audit logs error:', err);
    res.status(500).json({ message: 'Server error loading audit logs' });
  }
});

// Helper to sanitize strings for CSV format
function escapeCSVValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ── GET Exports ──────────────────────────────────────────
// Strictly requires logs_read permission for data exports
router.get('/export', auth, permissionCheck(['logs_read']), async (req, res) => {
  const { type } = req.query;
  try {
    let filename = 'report.csv';
    let headers = [];
    let rows = [];

    if (type === 'users') {
      filename = 'user_list.csv';
      headers = ['Username', 'Email', 'Full Name', 'Role', 'Status', 'Activity Score', 'Last Activity'];
      const users = await User.find().sort({ username: 1 });
      rows = users.map(u => [
        u.username,
        u.email || 'N/A',
        u.fullName || 'N/A',
        u.role,
        u.status,
        u.activityScore,
        u.lastActivity ? u.lastActivity.toISOString() : 'Never'
      ]);
    } 
    else if (type === 'roles') {
      filename = 'role_list.csv';
      headers = ['Role Name', 'Display Name', 'Enabled', 'System Role', 'Permissions Count', 'Created At'];
      const roles = await Role.find().sort({ name: 1 });
      rows = roles.map(r => [
        r.name,
        r.displayName,
        r.enabled ? 'Yes' : 'No',
        r.isSystem ? 'Yes' : 'No',
        r.permissions.length,
        r.createdAt ? r.createdAt.toISOString() : 'N/A'
      ]);
    } 
    else if (type === 'permissions') {
      filename = 'permission_matrix.csv';
      
      const modules = ['audios', 'albums', 'categories', 'users', 'roles', 'feedback', 'settings', 'logs'];
      headers = ['Role Name', 'Display Name', 'System Role'];
      // Add dynamic headers for each module CRUD
      modules.forEach(mod => {
        headers.push(`${mod.toUpperCase()} Create`);
        headers.push(`${mod.toUpperCase()} Read`);
        headers.push(`${mod.toUpperCase()} Update`);
        headers.push(`${mod.toUpperCase()} Delete`);
      });

      const roles = await Role.find().sort({ name: 1 });
      rows = roles.map(r => {
        const row = [r.name, r.displayName, r.isSystem ? 'Yes' : 'No'];
        modules.forEach(mod => {
          row.push(r.permissions.includes(`${mod}_create`) ? 'Allowed' : 'Denied');
          row.push(r.permissions.includes(`${mod}_read`) ? 'Allowed' : 'Denied');
          row.push(r.permissions.includes(`${mod}_update`) ? 'Allowed' : 'Denied');
          row.push(r.permissions.includes(`${mod}_delete`) ? 'Allowed' : 'Denied');
        });
        return row;
      });
    } 
    else if (type === 'activity') {
      filename = 'activity_reports.csv';
      headers = ['User Name', 'Assigned Role', 'Total Activity (Score)', 'Create Count', 'Update Count', 'Delete Count', 'Last Activity', 'Status'];
      const users = await User.find().sort({ activityScore: -1 });
      rows = users.map(u => [
        u.username,
        u.role,
        u.activityScore,
        u.createCount,
        u.updateCount,
        u.deleteCount,
        u.lastActivity ? u.lastActivity.toISOString() : 'Never',
        u.status
      ]);
    } 
    else if (type === 'audit') {
      filename = 'audit_logs.csv';
      headers = ['Timestamp', 'User', 'Assigned Role', 'Module', 'Action', 'IP Address', 'Browser/Device'];
      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000); // limit to 1000 latest to prevent overflow
      rows = logs.map(l => [
        l.timestamp ? l.timestamp.toISOString() : 'N/A',
        l.user,
        l.role,
        l.module,
        l.action,
        l.ipAddress || 'N/A',
        l.userAgent || 'N/A'
      ]);
    } 
    else if (type === 'status') {
      filename = 'status_reports.csv';
      headers = ['Username', 'Full Name', 'Role', 'Account Status', 'Activity Score', 'Last Active Time'];
      const users = await User.find().sort({ status: 1, username: 1 });
      rows = users.map(u => [
        u.username,
        u.fullName || 'N/A',
        u.role,
        u.status,
        u.activityScore,
        u.lastActivity ? u.lastActivity.toISOString() : 'Never'
      ]);
    } 
    else {
      return res.status(400).json({ message: 'Invalid export type requested' });
    }

    // Build the CSV file contents
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => escapeCSVValue(val)).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Reports] Export error:', err);
    res.status(500).json({ message: 'Server error generating export' });
  }
});

module.exports = router;
