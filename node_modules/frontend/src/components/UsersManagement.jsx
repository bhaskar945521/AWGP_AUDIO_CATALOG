import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// All available permissions grouped
const PERMISSION_GROUPS = [
  {
    name: 'Audio Library',
    icon: 'fas fa-music',
    permissions: [
      { value: 'audio_view',   label: 'View Audios' },
      { value: 'audio_upload', label: 'Upload Audio' },
      { value: 'audio_edit',   label: 'Edit Audio' },
      { value: 'audio_delete', label: 'Delete Audio' },
    ],
  },
  {
    name: 'Category Management',
    icon: 'fas fa-tags',
    permissions: [
      { value: 'category_view',   label: 'View' },
      { value: 'category_create', label: 'Create' },
      { value: 'category_edit',   label: 'Edit' },
      { value: 'category_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Album Management',
    icon: 'fas fa-compact-disc',
    permissions: [
      { value: 'album_view',   label: 'View' },
      { value: 'album_create', label: 'Create' },
      { value: 'album_edit',   label: 'Edit' },
      { value: 'album_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Feedback',
    icon: 'fas fa-comments',
    permissions: [
      { value: 'feedback_view',   label: 'View' },
      { value: 'feedback_delete', label: 'Delete' },
    ],
  },
];
// Single‑select options for Onlyuser role (only one may be chosen)
const SINGLE_OPTIONS = [
  { name: 'Audio Library', permissions: ['audio_view','audio_upload','audio_edit','audio_delete'] },
  { name: 'Category Management', permissions: ['category_view','category_create','category_edit','category_delete'] },
  { name: 'Album Management', permissions: ['album_view','album_create','album_edit','album_delete'] },
  { name: 'Upload Audio', permissions: ['audio_upload'] },
  { name: 'Feedback Management', permissions: ['feedback_view','feedback_delete'] },
  { name: 'Analytics Dashboard', permissions: ['analytics_view'] },
];

function getGroupPermissions(name) {
  const group = PERMISSION_GROUPS.find(g => g.name === name);
  return group ? group.permissions.map(p => p.value) : [];
}

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
  selectedGroups: [], // holds selected groups for Onlyuser
};

// ── Permission picker used in both Create and Edit ───────────────
function PermissionPicker({ role, permissions, onChange, selectedOptions = [], onToggleOption }) {
  // For admin, pre-select all groups by default if none selected
  const effectiveSelected = role === 'admin' && selectedOptions.length === 0
    ? SINGLE_OPTIONS.map(o => o.name)
    : selectedOptions;

  const toggleOption = (opt) => {
    const newSelected = effectiveSelected.includes(opt.name)
      ? effectiveSelected.filter(name => name !== opt.name)
      : [...effectiveSelected, opt.name];
    if (onToggleOption) onToggleOption(newSelected);
    const combinedPerms = SINGLE_OPTIONS
      .filter(o => newSelected.includes(o.name))
      .flatMap(o => o.permissions);
    if (onChange) onChange(combinedPerms);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
      {SINGLE_OPTIONS.map(opt => (
        <label key={opt.name} style={{
          background: effectiveSelected.includes(opt.name) ? 'rgba(247,168,77,0.08)' : 'var(--card-bg, rgba(255,255,255,0.03))',
          border: `2px solid ${effectiveSelected.includes(opt.name) ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s',
        }}>
          <input
            type="checkbox"
            checked={effectiveSelected.includes(opt.name)}
            onChange={() => toggleOption(opt)}
            style={{ display: 'none' }}
          />
          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: effectiveSelected.includes(opt.name) ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {opt.name}
          </span>
        </label>
      ))}
    </div>
  );
}

// ── Role Badge ───────────────────────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    admin:    { bg: 'rgba(247,168,77,0.15)', color: '#f7a84d', icon: 'fas fa-crown' },
    onlyuser: { bg: 'rgba(66,153,225,0.15)', color: '#4299e1', icon: 'fas fa-user-shield' },
  };
  const s = styles[role] || { bg: 'rgba(160,160,160,0.12)', color: '#aaa', icon: 'fas fa-user' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '99px',
      background: s.bg, color: s.color,
      fontSize: '0.76rem', fontWeight: 700,
    }}>
      <i className={s.icon} />
      {role === 'onlyuser' ? 'Only User' : role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function UsersManagement() {
  const { token, isAdmin } = useAuth();
  const authConfig = () => ({ headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });

  const [users, setUsers]           = useState([]);
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

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', authConfig());
      // Show only admin + onlyuser roles
      setUsers(res.data.filter(u => u.role === 'admin' || u.role === 'onlyuser'));
    } catch {
      toast.error('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  // When role changes in new user form — auto-set permissions
  const handleRoleChange = (role, target = 'new') => {
    if (target === 'new') {
      setNewUser(prev => ({
        ...prev,
        role,
        permissions: role === 'admin' ? [...ALL_PERMISSIONS] : [],
        selectedGroups: [], // reset groups for Onlyuser
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        role,
        permissions: role === 'admin' ? [...ALL_PERMISSIONS] : [],
        selectedGroups: [], // reset groups for Onlyuser edit
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
      }, authConfig());
      toast.success('User created successfully!');
      setNewUser(EMPTY_FORM);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      fullName: user.fullName || '',
      email: user.email || '',
      permissions: user.permissions || [],
      password: '',
      confirmPassword: '',
      assignedWork: user.assignedWork || '',
      selectedGroup: '',
    });
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
        ...(editForm.password ? { password: editForm.password } : {}),
      }, authConfig());
      toast.success('User updated!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`, authConfig());
      toast.success('User deleted');
      fetchUsers();
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

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title"><i className="fas fa-users" /> User Access</span>
        <span className="admin-panel-count">{users.length} users</span>
      </div>

      {/* ── Create User Form ─────────────────────────────────── */}
      <form onSubmit={handleCreate} style={{
        background: 'var(--card-bg, rgba(255,255,255,0.03))',
        border: '1.5px solid var(--border)', borderRadius: '16px',
        padding: '24px', marginBottom: '28px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-user-plus" style={{ color: 'var(--saffron, #f7a84d)' }} /> Add New User
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

        {/* Role selector — only Admin / OnlyUser */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Role
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { val: 'onlyuser', label: 'Only User', icon: 'fas fa-user-shield', desc: 'Customizable permissions' },
              { val: 'admin',    label: 'Admin',     icon: 'fas fa-crown',        desc: 'Full access to everything' },
            ].map(r => (
              <label key={r.val} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${newUser.role === r.val ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
                background: newUser.role === r.val ? 'rgba(247,168,77,0.08)' : 'transparent',
                flex: 1, transition: 'all 0.2s', userSelect: 'none',
              }}>
                <input type="radio" name="newRole" value={r.val} checked={newUser.role === r.val}
                  onChange={() => handleRoleChange(r.val, 'new')} style={{ display: 'none' }} />
                <i className={r.icon} style={{ fontSize: '1.1rem', color: newUser.role === r.val ? 'var(--saffron, #f7a84d)' : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: newUser.role === r.val ? 'var(--text-main)' : 'var(--text-muted)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
              </label>
            ))}
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
                <div style={{ fontWeight: 800, color: '#1a1a2e', fontSize: '0.9rem' }}>All Permissions Auto-Granted</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                  Admin role gets full access to all {ALL_PERMISSIONS.length} features automatically.
                </div>
              </div>
              <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px', background: '#f7a84d', color: '#fff', fontSize: '0.76rem', fontWeight: 800 }}>
                {ALL_PERMISSIONS.length} Permissions
              </span>
            </div>
          ) : (
            <PermissionPicker
              role={newUser.role}
              permissions={newUser.permissions}
              selectedOptions={newUser.selectedGroups}
              onToggleOption={newSelected => setNewUser(p => ({ ...p, selectedGroups: newSelected }))}
              onChange={perms => setNewUser(p => ({ ...p, permissions: perms }))}
            />
          )}
        </div>

        <button type="submit" disabled={creating} style={{
          padding: '11px 28px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
          border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
          cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {creating ? <><i className="fas fa-spinner fa-spin" /> Creating...</> : <><i className="fas fa-plus" /> Create User</>}
        </button>
      </form>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '95vw' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Edit User — <span style={{ color: 'var(--saffron, #f7a84d)' }}>{editingUser.username}</span></h3>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>

              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input style={inputStyle} type="text" placeholder="Full Name" value={editForm.fullName}
                  onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
                <input style={inputStyle} type="email" placeholder="Email" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                <input style={{ ...inputStyle, gridColumn: '1/-1' }} type="text" placeholder="Assigned Work"
                  value={editForm.assignedWork}
                  onChange={e => setEditForm(p => ({ ...p, assignedWork: e.target.value }))} />

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

              {/* Role */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Role</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { val: 'onlyuser', label: 'Only User', icon: 'fas fa-user-shield' },
                    { val: 'admin',    label: 'Admin',     icon: 'fas fa-crown' },
                  ].map(r => {
                    const isLastAdmin = editingUser.role === 'admin' && adminCount <= 1 && r.val !== 'admin';
                    return (
                      <label key={r.val} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', borderRadius: '12px',
                        cursor: isLastAdmin ? 'not-allowed' : 'pointer',
                        border: `2px solid ${editForm.role === r.val ? 'var(--saffron, #f7a84d)' : 'var(--border)'}`,
                        background: editForm.role === r.val ? 'rgba(247,168,77,0.08)' : 'transparent',
                        flex: 1, transition: 'all 0.2s', userSelect: 'none',
                        opacity: isLastAdmin ? 0.5 : 1,
                      }}>
                        <input type="radio" checked={editForm.role === r.val} disabled={isLastAdmin}
                          onChange={() => !isLastAdmin && handleRoleChange(r.val, 'edit')} style={{ display: 'none' }} />
                        <i className={r.icon} style={{ color: editForm.role === r.val ? 'var(--saffron, #f7a84d)' : 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: editForm.role === r.val ? 'var(--text-main)' : 'var(--text-muted)' }}>{r.label}</span>
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

              {/* Permissions */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Permissions</div>
                {editForm.role === 'admin' ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(247,168,77,0.08)',
                    border: '2px solid rgba(247,168,77,0.35)',
                  }}>
                    <i className="fas fa-crown" style={{ color: '#f7a84d', fontSize: '1.1rem' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#1a1a2e', fontSize: '0.9rem' }}>All Permissions Auto-Granted</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                        Admin role gets full access to all {ALL_PERMISSIONS.length} features automatically.
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px', background: '#f7a84d', color: '#fff', fontSize: '0.76rem', fontWeight: 800 }}>
                      {ALL_PERMISSIONS.length} Permissions
                    </span>
                  </div>
                ) : (
                  <PermissionPicker
                    role={editForm.role}
                    permissions={editForm.permissions}
                    selectedOptions={editForm.selectedGroups || []}
                    onToggleOption={newSelected => setEditForm(p => ({ ...p, selectedGroups: newSelected }))}
                    onChange={perms => setEditForm(p => ({ ...p, permissions: perms }))}
                  />
                )}
              </div>
            </div>
            <div className="modal-actions" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleEdit}>
                <i className="fas fa-save" style={{ marginRight: 6 }} />Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Users List ───────────────────────────────────────── */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading users...</p></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No users found.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => {
            const isLastAdmin = u.role === 'admin' && adminCount <= 1;
            const permCount = u.role === 'admin' ? ALL_PERMISSIONS.length : (u.permissions?.length || 0);

            return (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                padding: '16px 20px', borderRadius: '14px',
                background: 'var(--card-bg, rgba(255,255,255,0.03))',
                border: '1.5px solid var(--border)',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: u.role === 'admin'
                    ? 'linear-gradient(135deg, #f7a84d, #f59e0b)'
                    : 'linear-gradient(135deg, #4299e1, #3182ce)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: '#fff',
                }}>
                  {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{u.username}</span>
                    <RoleBadge role={u.role} />
                    {isLastAdmin && (
                      <span style={{ fontSize: '0.72rem', color: '#f6ad55' }}>
                        <i className="fas fa-lock" style={{ marginRight: 3 }} />Last admin
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
                    {u.role === 'admin' ? (
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
                  <button onClick={() => startEdit(u)} className="admin-action-btn edit" title="Edit User">
                    <i className="fas fa-edit" />
                  </button>
                  <button
                    onClick={() => !isLastAdmin && handleDelete(u._id)}
                    className="admin-action-btn delete"
                    title={isLastAdmin ? 'Last admin — cannot delete' : 'Delete User'}
                    disabled={isLastAdmin}
                    style={{ opacity: isLastAdmin ? 0.4 : 1, cursor: isLastAdmin ? 'not-allowed' : 'pointer' }}
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
