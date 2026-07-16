import React, { useState, useEffect } from 'react';
import api, { resolveUrl } from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// All available permissions grouped (standardized)
const PERMISSION_GROUPS = [
  {
    name: 'Audio Library',
    icon: 'fas fa-music',
    permissions: [
      { value: 'audios_read',     label: 'View / Listen' },
      { value: 'audios_create',   label: 'Upload Audio' },
      { value: 'audios_update',   label: 'Edit Audio' },
      { value: 'audios_delete',   label: 'Delete Audio' },
      { value: 'audios_download', label: 'Download Audio' },
      { value: 'audios_print',    label: 'Print Details' },
    ],
  },
  {
    name: 'Category Management',
    icon: 'fas fa-tags',
    permissions: [
      { value: 'categories_read',   label: 'View Categories' },
      { value: 'categories_create', label: 'Create Category' },
      { value: 'categories_update', label: 'Edit Category' },
      { value: 'categories_delete', label: 'Delete Category' },
    ],
  },
  {
    name: 'Album Management',
    icon: 'fas fa-compact-disc',
    permissions: [
      { value: 'albums_read',   label: 'View Albums' },
      { value: 'albums_create', label: 'Create Album' },
      { value: 'albums_update', label: 'Edit Album' },
      { value: 'albums_delete', label: 'Delete Album' },
    ],
  },
  {
    name: 'Feedback',
    icon: 'fas fa-comments',
    permissions: [
      { value: 'feedback_read',   label: 'View Feedback' },
      { value: 'feedback_delete', label: 'Delete Feedback' },
    ],
  },
  {
    name: 'Users Management',
    icon: 'fas fa-users',
    permissions: [
      { value: 'users_read',   label: 'View Users' },
      { value: 'users_create', label: 'Create User' },
      { value: 'users_update', label: 'Edit User' },
      { value: 'users_delete', label: 'Delete User' },
    ],
  },
  {
    name: 'Roles Management',
    icon: 'fas fa-user-shield',
    permissions: [
      { value: 'roles_read',   label: 'View Roles' },
      { value: 'roles_create', label: 'Create Role' },
      { value: 'roles_update', label: 'Edit Role' },
      { value: 'roles_delete', label: 'Delete Role' },
    ],
  },
  {
    name: 'System & Analytics',
    icon: 'fas fa-cogs',
    permissions: [
      { value: 'logs_read',       label: 'Audit Logs' },
      { value: 'analytics_view',   label: 'Analytics' },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.value));

const EMPTY_FORM = {
  username: '',
  password: '',
  confirmPassword: '',
  role: 'onlyuser',
  fullName: '',
  email: '',
  permissions: [],
  assignedWork: '',
  status: 'Active',
};

// ── Permission picker ────────────────────────────────────────────
function PermissionPicker({ permissions = [], onChange }) {
  const handleToggle = (val) => {
    const newPerms = permissions.includes(val)
      ? permissions.filter(p => p !== val)
      : [...permissions, val];
    if (onChange) onChange(newPerms);
  };

  const handleSelectAll = (groupPerms, all) => {
    let newPerms = [...permissions];
    if (all) {
      groupPerms.forEach(p => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
    } else {
      newPerms = newPerms.filter(p => !groupPerms.includes(p));
    }
    if (onChange) onChange(newPerms);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '10px' }}>
      {PERMISSION_GROUPS.map(group => {
        const groupVals = group.permissions.map(p => p.value);
        const allSelected = groupVals.every(v => permissions.includes(v));
        const someSelected = groupVals.some(v => permissions.includes(v)) && !allSelected;
        
        return (
          <div key={group.name} style={{
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--card-bg, rgba(255,255,255,0.01))',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'var(--border-saffron, rgba(247,168,77,0.08))',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1.5px solid var(--border)'
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                <i className={group.icon} style={{ marginRight: 8, color: 'var(--saffron, #f7a84d)' }} />
                {group.name}
              </span>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={e => handleSelectAll(groupVals, e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.permissions.map(p => (
                <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.value)}
                    onChange={() => handleToggle(p.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: permissions.includes(p.value) ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Role Badge ───────────────────────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    admin:       { bg: 'rgba(247,168,77,0.15)',  color: '#f7a84d', icon: 'fas fa-crown',       label: 'Admin' },
    onlyuser:    { bg: 'rgba(66,153,225,0.15)',  color: '#4299e1', icon: 'fas fa-user-cog',    label: 'Operator' },
    public_user: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', icon: 'fas fa-user-circle', label: 'Public User' },
  };
  const s = styles[role] || { bg: 'rgba(160,160,160,0.12)', color: '#aaa', icon: 'fas fa-user', label: role };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '99px',
      background: s.bg, color: s.color,
      fontSize: '0.76rem', fontWeight: 700,
    }}>
      <i className={s.icon} />
      {s.label}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function UsersManagement() {
  const { token, isAdmin, hasPermission } = useAuth();
  const authConfig = () => ({ headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });

  const [users, setUsers]           = useState([]);
  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [newUser, setNewUser]       = useState(EMPTY_FORM);
  const [showPw, setShowPw]         = useState(false);
  const [showCPw, setShowCPw]       = useState(false);

  // Edit modal
  const [editingUser, setEditingUser]   = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [showEditPw, setShowEditPw]     = useState(false);
  const [showEditCPw, setShowEditCPw]   = useState(false);
  // Convert public user flow state
  const [convertMode, setConvertMode]   = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users', authConfig()),
        api.get('/roles', authConfig())
      ]);
      setUsers(usersRes.data);
      setDynamicRoles(rolesRes.data.filter(r => r.enabled || r.name === 'admin'));
    } catch {
      toast.error('Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsersAndRoles(); }, []); // eslint-disable-line

  // When role changes in new user form — auto-set permissions
  const handleRoleChange = (role, target = 'new') => {
    const matchedRole = dynamicRoles.find(r => r.name === role);
    const defaultPerms = matchedRole ? matchedRole.permissions : [];

    if (target === 'new') {
      setNewUser(prev => ({
        ...prev,
        role,
        permissions: role === 'admin' ? [...ALL_PERMISSIONS] : defaultPerms,
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        role,
        permissions: role === 'admin' ? [...ALL_PERMISSIONS] : defaultPerms,
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password) return toast.error('Username and password required');
    if (newUser.password !== newUser.confirmPassword) return toast.error('Passwords do not match');
    if (newUser.password.length < 6) return toast.error('Password must be at least 6 characters');

    setCreating(true);
    try {
      await api.post('/users', {
        username: newUser.username.trim(),
        password: newUser.password,
        role: newUser.role,
        fullName: newUser.fullName,
        email: newUser.email,
        permissions: newUser.role === 'admin' ? ALL_PERMISSIONS : newUser.permissions,
        assignedWork: newUser.assignedWork,
        status: newUser.status,
      }, authConfig());
      toast.success('User created successfully!');
      setNewUser(EMPTY_FORM);
      fetchUsersAndRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create operator');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user) => {
    setConvertMode(false); // reset convert mode on new edit
    setEditingUser(user);
    setEditForm({
      role: user.role,
      fullName: user.fullName || '',
      email: user.email || '',
      permissions: user.permissions || [],
      password: '',
      confirmPassword: '',
      assignedWork: user.assignedWork || '',
      status: user.status || 'Active',
    });
  };

  // Activate convert mode — auto-fill form for converting public user to Operator
  const activateConvertMode = () => {
    setConvertMode(true);
    setEditForm(prev => ({
      ...prev,
      role: 'onlyuser',
      fullName: editingUser.fullName || '',
      email: editingUser.email || '',
      permissions: [],
      assignedWork: '',
      status: 'Active',
      password: '',
      confirmPassword: '',
    }));
  };

  const handleEdit = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await api.put(`/users/${editingUser._id}`, {
        role: editForm.role,
        fullName: editForm.fullName,
        email: editForm.email,
        permissions: editForm.role === 'admin' ? ALL_PERMISSIONS : editForm.permissions,
        assignedWork: editForm.assignedWork,
        status: editForm.status,
        ...(editForm.password ? { password: editForm.password } : {}),
      }, authConfig());

      const successMsg = convertMode
        ? `${editingUser.fullName || editingUser.username} ko Operator banaya gaya! ✅`
        : 'User updated!';
      toast.success(successMsg);
      setEditingUser(null);
      setConvertMode(false);
      fetchUsersAndRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`, authConfig());
      toast.success('User deleted');
      fetchUsersAndRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid var(--border)', background: 'var(--card-bg, rgba(255,255,255,0.04))',
    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
    boxSizing: 'border-box',
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const operatorCount = users.filter(u => u.role === 'onlyuser').length;
  const publicCount = users.filter(u => u.role === 'public_user').length;

  const isPublicUserEditing = editingUser?.role === 'public_user';

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title"><i className="fas fa-users" /> User Access</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(247,168,77,0.15)', color: '#f7a84d', fontWeight: 700 }}>
            <i className="fas fa-crown" style={{ marginRight: 4 }} />{adminCount} Admin
          </span>
          <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(66,153,225,0.15)', color: '#4299e1', fontWeight: 700 }}>
            <i className="fas fa-user-cog" style={{ marginRight: 4 }} />{operatorCount} Operator
          </span>
          <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontWeight: 700 }}>
            <i className="fas fa-user-circle" style={{ marginRight: 4 }} />{publicCount} Public
          </span>
        </div>
      </div>

      {/* ── Create Operator Form ──────────────────────────────── */}
      {(isAdmin || hasPermission('users_create')) && (
      <form onSubmit={handleCreate} style={{
        background: 'var(--card-bg, rgba(255,255,255,0.03))',
        border: '1.5px solid var(--border)', borderRadius: '16px',
        padding: '24px', marginBottom: '28px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-user-plus" style={{ color: 'var(--saffron, #f7a84d)' }} /> Add New Operator
        </h3>

        {/* Basic info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <input style={inputStyle} type="text" placeholder="Username *" value={newUser.username}
            onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} required />
          <input style={inputStyle} type="text" placeholder="Full Name" value={newUser.fullName}
            onChange={e => setNewUser(p => ({ ...p, fullName: e.target.value }))} />
          <input style={inputStyle} type="email" placeholder="Email" value={newUser.email}
            onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
          <input style={inputStyle} type="text" placeholder="Assigned Work" value={newUser.assignedWork}
            onChange={e => setNewUser(p => ({ ...p, assignedWork: e.target.value }))} />
          <select style={inputStyle} value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <input style={{ ...inputStyle, paddingRight: 40 }} type={showPw ? 'text' : 'password'}
              placeholder="Password *" value={newUser.password}
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required />
            <button type="button" onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <i className={showPw ? 'fas fa-eye-slash' : 'fas fa-eye'} />
            </button>
          </div>

          {/* Confirm Password */}
          <div style={{ position: 'relative' }}>
            <input style={{ ...inputStyle, paddingRight: 40 }} type={showCPw ? 'text' : 'password'}
              placeholder="Confirm Password *" value={newUser.confirmPassword}
              onChange={e => setNewUser(p => ({ ...p, confirmPassword: e.target.value }))} required />
            <button type="button" onClick={() => setShowCPw(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <i className={showCPw ? 'fas fa-eye-slash' : 'fas fa-eye'} />
            </button>
          </div>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Role
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {dynamicRoles.map(r => (
              <label key={r.name} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${newUser.role === r.name ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
                background: newUser.role === r.name ? 'rgba(247,168,77,0.08)' : 'transparent',
                flex: 1, transition: 'all 0.2s', userSelect: 'none',
              }}>
                <input type="radio" name="newRole" value={r.name} checked={newUser.role === r.name}
                  onChange={() => handleRoleChange(r.name, 'new')} style={{ display: 'none' }} />
                <i className={r.isSystem ? 'fas fa-shield-alt' : 'fas fa-user-tag'} style={{ fontSize: '1.1rem', color: newUser.role === r.name ? 'var(--saffron, #f7a84d)' : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: newUser.role === r.name ? 'var(--text-main)' : 'var(--text-muted)' }}>{r.displayName}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.permissions.length} permissions</div>
                </div>
              </label>
            ))}
            {/* Fallback operator role if not in DB */}
            {!dynamicRoles.find(r => r.name === 'onlyuser') && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${newUser.role === 'onlyuser' ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
                background: newUser.role === 'onlyuser' ? 'rgba(247,168,77,0.08)' : 'transparent',
                flex: 1, transition: 'all 0.2s', userSelect: 'none',
              }}>
                <input type="radio" name="newRole" value="onlyuser" checked={newUser.role === 'onlyuser'}
                  onChange={() => handleRoleChange('onlyuser', 'new')} style={{ display: 'none' }} />
                <i className="fas fa-user-cog" style={{ fontSize: '1.1rem', color: newUser.role === 'onlyuser' ? 'var(--saffron, #f7a84d)' : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: newUser.role === 'onlyuser' ? 'var(--text-main)' : 'var(--text-muted)' }}>Operator</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Legacy custom</div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Permissions
          </div>
          {newUser.role === 'admin' ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 18px', borderRadius: '12px',
              background: 'rgba(247,168,77,0.08)',
              border: '2px solid rgba(247,168,77,0.35)',
            }}>
              <i className="fas fa-crown" style={{ color: '#f7a84d', fontSize: '1.1rem' }} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>All Permissions Auto-Granted</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Admin role gets full access to all {ALL_PERMISSIONS.length} features automatically.
                </div>
              </div>
              <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px', background: '#f7a84d', color: '#fff', fontSize: '0.76rem', fontWeight: 800 }}>
                {ALL_PERMISSIONS.length} Permissions
              </span>
            </div>
          ) : (
            <PermissionPicker
              permissions={newUser.permissions}
              onChange={perms => setNewUser(p => ({ ...p, permissions: perms }))}
            />
          )}
        </div>

        <button type="submit" disabled={creating || !(isAdmin || hasPermission('users_create'))} style={{
          padding: '11px 28px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
          border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
          cursor: (creating || !(isAdmin || hasPermission('users_create'))) ? 'not-allowed' : 'pointer', opacity: (creating || !(isAdmin || hasPermission('users_create'))) ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {creating ? <><i className="fas fa-spinner fa-spin" /> Creating...</> : <><i className="fas fa-plus" /> Create Operator</>}
        </button>
      </form>
      )}

      {/* ── Edit / Convert Modal ──────────────────────────────── */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => { setEditingUser(null); setConvertMode(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '95vw' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>
                {convertMode
                  ? <><i className="fas fa-exchange-alt" style={{ color: 'var(--saffron, #f7a84d)', marginRight: 8 }} />Convert to Operator — <span style={{ color: 'var(--saffron, #f7a84d)' }}>{editingUser.username}</span></>
                  : <>Edit User — <span style={{ color: 'var(--saffron, #f7a84d)' }}>{editingUser.username}</span></>
                }
              </h3>
              <button className="modal-close-btn" onClick={() => { setEditingUser(null); setConvertMode(false); }}><i className="fas fa-times" /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>

              {/* ── PUBLIC USER: Show Convert Button (when NOT in convertMode) ── */}
              {isPublicUserEditing && !convertMode && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(247, 168, 77, 0.12), rgba(245, 158, 11, 0.08))',
                  border: '2px solid rgba(247, 168, 77, 0.4)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                      <i className="fas fa-user-circle" style={{ color: 'var(--saffron, #f7a84d)', fontSize: '1.2rem' }} />
                      <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>Public User Account</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Is public user ko Operator banane ke liye neeche diya button click karein.
                      Uski information automatically fill ho jayegi.
                    </div>
                    {editingUser.fullName && (
                      <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <i className="fas fa-id-card" style={{ marginRight: 6, color: 'var(--saffron, #f7a84d)' }} />
                        {editingUser.fullName}
                        {editingUser.email && <span style={{ marginLeft: 10, color: 'var(--text-muted)' }}>{editingUser.email}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={activateConvertMode}
                    style={{
                      padding: '10px 20px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
                      border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      boxShadow: '0 4px 15px rgba(247, 168, 77, 0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fas fa-exchange-alt" />
                    Change Public User to Operator
                  </button>
                </div>
              )}

              {/* ── CONVERT MODE: Confirmation Banner ── */}
              {convertMode && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.08))',
                  border: '2px solid rgba(16,185,129,0.4)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <i className="fas fa-info-circle" style={{ color: '#10b981', fontSize: '1.1rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                      Convert Mode Active
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Information auto-fill ho gayi hai. Permissions select karein aur "Change to Operator" button press karein.
                    </div>
                  </div>
                  <button
                    onClick={() => setConvertMode(false)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                  >
                    <i className="fas fa-times" /> Cancel
                  </button>
                </div>
              )}

              {/* ── Edit fields (shown for non-public, or when convertMode is active) ── */}
              {(!isPublicUserEditing || convertMode) && (
                <>
                  {/* Basic info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input style={inputStyle} type="text" placeholder="Full Name" value={editForm.fullName}
                      onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
                    <input style={inputStyle} type="email" placeholder="Email" value={editForm.email}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                    <input style={{ ...inputStyle, gridColumn: '1/-1' }} type="text" placeholder="Assigned Work"
                      value={editForm.assignedWork}
                      onChange={e => setEditForm(p => ({ ...p, assignedWork: e.target.value }))} />
                    <select style={{ ...inputStyle, gridColumn: '1/-1' }} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>

                    {/* Password */}
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: 40 }} type={showEditPw ? 'text' : 'password'}
                        placeholder="New password (leave blank to keep)" value={editForm.password}
                        onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowEditPw(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <i className={showEditPw ? 'fas fa-eye-slash' : 'fas fa-eye'} />
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: 40 }} type={showEditCPw ? 'text' : 'password'}
                        placeholder="Confirm new password" value={editForm.confirmPassword}
                        onChange={e => setEditForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                      <button type="button" onClick={() => setShowEditCPw(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <i className={showEditCPw ? 'fas fa-eye-slash' : 'fas fa-eye'} />
                      </button>
                    </div>
                  </div>

                  {/* Role — hidden in convert mode (always onlyuser) */}
                  {!convertMode && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Role</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                        {dynamicRoles.map(r => {
                          const isLastAdmin = editingUser.role === 'admin' && adminCount <= 1 && r.name !== 'admin';
                          return (
                            <label key={r.name} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 16px', borderRadius: '12px',
                              cursor: isLastAdmin ? 'not-allowed' : 'pointer',
                              border: `2px solid ${editForm.role === r.name ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
                              background: editForm.role === r.name ? 'rgba(247,168,77,0.08)' : 'transparent',
                              flex: 1, transition: 'all 0.2s', userSelect: 'none',
                              opacity: isLastAdmin ? 0.5 : 1,
                            }}>
                              <input type="radio" checked={editForm.role === r.name} disabled={isLastAdmin}
                                onChange={() => !isLastAdmin && handleRoleChange(r.name, 'edit')} style={{ display: 'none' }} />
                              <i className={r.isSystem ? 'fas fa-shield-alt' : 'fas fa-user-tag'} style={{ color: editForm.role === r.name ? 'var(--saffron, #f7a84d)' : 'var(--text-muted)' }} />
                              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: editForm.role === r.name ? 'var(--text-main)' : 'var(--text-muted)' }}>{r.displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                      {editingUser.role === 'admin' && adminCount <= 1 && (
                        <div style={{ marginTop: 8, fontSize: '0.76rem', color: '#f6ad55' }}>
                          <i className="fas fa-lock" style={{ marginRight: 4 }} />Last admin — create another admin first to change this role.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Permissions */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      {convertMode ? 'Select Permissions for Operator' : 'Permissions'}
                    </div>
                    {editForm.role === 'admin' && !convertMode ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 18px', borderRadius: '12px',
                        background: 'rgba(247,168,77,0.08)',
                        border: '2px solid rgba(247,168,77,0.35)',
                      }}>
                        <i className="fas fa-crown" style={{ color: '#f7a84d', fontSize: '1.1rem' }} />
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>All Permissions Auto-Granted</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Admin role gets full access to all {ALL_PERMISSIONS.length} features automatically.
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px', background: '#f7a84d', color: '#fff', fontSize: '0.76rem', fontWeight: 800 }}>
                          {ALL_PERMISSIONS.length} Permissions
                        </span>
                      </div>
                    ) : (
                      <PermissionPicker
                        permissions={editForm.permissions}
                        onChange={perms => setEditForm(p => ({ ...p, permissions: perms }))}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setEditingUser(null); setConvertMode(false); }}>Cancel</button>
              {/* Only show save/change button when fields are visible */}
              {(!isPublicUserEditing || convertMode) && (
                convertMode ? (
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: '10px 22px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
                      border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 15px rgba(247, 168, 77, 0.3)',
                    }}
                  >
                    <i className="fas fa-exchange-alt" /> Change to Operator
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleEdit}>
                    <i className="fas fa-save" style={{ marginRight: 6 }} />Save Changes
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Users List ────────────────────────────────────────── */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading users...</p></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No users found.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => {
            const isLastAdmin = u.role === 'admin' && adminCount <= 1;
            const permCount = u.role === 'admin' ? ALL_PERMISSIONS.length : (u.permissions?.length || 0);
            const isPublic = u.role === 'public_user';

            return (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                padding: '16px 20px', borderRadius: '14px',
                background: isPublic
                  ? 'rgba(139,92,246,0.04)'
                  : 'var(--card-bg, rgba(255,255,255,0.03))',
                border: isPublic
                  ? '1.5px solid rgba(139,92,246,0.25)'
                  : '1.5px solid var(--border)',
                transition: 'all 0.2s',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: u.role === 'admin'
                    ? 'linear-gradient(135deg, #f7a84d, #f59e0b)'
                    : u.role === 'public_user'
                    ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                    : 'linear-gradient(135deg, #4299e1, #3182ce)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: '#fff',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span>{(u.fullName || u.username || '?').charAt(0).toUpperCase()}</span>
                  {u.avatarUrl && (
                    <img src={resolveUrl(u.avatarUrl)} alt="avatar" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{u.username}</span>
                    <RoleBadge role={u.role} />
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      fontWeight: 600,
                      background: (!u.status || u.status === 'Active') ? 'rgba(16,185,129,0.15)' : u.status === 'Suspended' ? 'rgba(229,62,62,0.15)' : 'rgba(160,160,160,0.15)',
                      color: (!u.status || u.status === 'Active') ? '#10b981' : u.status === 'Suspended' ? '#e53e3e' : '#a0aec0'
                    }}>
                      {u.status || 'Active'}
                    </span>
                    {isLastAdmin && (
                      <span style={{ fontSize: '0.72rem', color: '#f6ad55' }}>
                        <i className="fas fa-lock" style={{ marginRight: 3 }} />Last admin
                      </span>
                    )}
                    {isPublic && (
                      <span style={{ fontSize: '0.72rem', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                        <i className="fas fa-globe" style={{ marginRight: 3 }} />Registered via website
                      </span>
                    )}
                  </div>
                  {(u.fullName || u.email) && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.fullName && <span>{u.fullName}</span>}
                      {u.fullName && u.email && <span style={{ margin: '0 6px' }}>·</span>}
                      {u.email && <span>{u.email}</span>}
                    </div>
                  )}
                  {u.assignedWork && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--saffron, #f7a84d)', marginTop: 3 }}>
                      <i className="fas fa-tasks" style={{ marginRight: 4 }} />{u.assignedWork}
                    </div>
                  )}
                  {/* Permission chips */}
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {isPublic ? (
                      <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontStyle: 'italic' }}>
                        No operator permissions — click Edit to convert
                      </span>
                    ) : u.role === 'admin' ? (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(247,168,77,0.15)', color: '#f7a84d', fontWeight: 600 }}>
                        All Features ({ALL_PERMISSIONS.length})
                      </span>
                    ) : u.permissions?.length > 0 ? (
                      <>
                        {u.permissions.slice(0, 4).map(p => (
                          <span key={p} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(66,153,225,0.12)', color: '#4299e1', fontWeight: 600 }}>
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {u.permissions.length > 4 && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(160,160,160,0.12)', color: 'var(--text-muted)' }}>
                            +{u.permissions.length - 4} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No permissions</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => (isAdmin || hasPermission('users_update')) && startEdit(u)}
                    className="admin-action-btn edit"
                    disabled={!(isAdmin || hasPermission('users_update'))}
                    style={{
                      opacity: !(isAdmin || hasPermission('users_update')) ? 0.4 : 1,
                      cursor: !(isAdmin || hasPermission('users_update')) ? 'not-allowed' : 'pointer',
                      ...(isPublic && (isAdmin || hasPermission('users_update')) ? { background: 'var(--saffron-pale, #fff3e0)', borderColor: 'var(--saffron-border, rgba(255, 152, 0, 0.22))', color: 'var(--saffron, #f7a84d)' } : {})
                    }}
                    title={!(isAdmin || hasPermission('users_update')) ? 'Edit disabled (insufficient permission)' : (isPublic ? 'Convert to Operator' : 'Edit User')}
                  >
                    <i className={isPublic ? 'fas fa-exchange-alt' : 'fas fa-edit'} />
                  </button>
                  <button
                    onClick={() => !isLastAdmin && (isAdmin || hasPermission('users_delete')) && handleDelete(u._id)}
                    className="admin-action-btn delete"
                    title={isLastAdmin ? 'Last admin — cannot delete' : !(isAdmin || hasPermission('users_delete')) ? 'Delete disabled (insufficient permission)' : 'Delete User'}
                    disabled={isLastAdmin || !(isAdmin || hasPermission('users_delete'))}
                    style={{ opacity: (isLastAdmin || !(isAdmin || hasPermission('users_delete'))) ? 0.4 : 1, cursor: (isLastAdmin || !(isAdmin || hasPermission('users_delete'))) ? 'not-allowed' : 'pointer' }}
                  >
                    <i className={isLastAdmin ? 'fas fa-lock' : 'fas fa-trash-alt'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
