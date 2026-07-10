import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Define all available permissions, grouped by category
const PERMISSION_GROUPS = [
  {
    name: 'Audio Library',
    permissions: [
      { value: 'audio_view', label: 'View' },
      { value: 'audio_upload', label: 'Upload' },
      { value: 'audio_edit', label: 'Edit' },
      { value: 'audio_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Category Management',
    permissions: [
      { value: 'category_view', label: 'View' },
      { value: 'category_create', label: 'Create' },
      { value: 'category_edit', label: 'Edit' },
      { value: 'category_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Album Management',
    permissions: [
      { value: 'album_view', label: 'View' },
      { value: 'album_create', label: 'Create' },
      { value: 'album_edit', label: 'Edit' },
      { value: 'album_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Feedback Management',
    permissions: [
      { value: 'feedback_view', label: 'View' },
      { value: 'feedback_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Analytics Dashboard',
    permissions: [
      { value: 'analytics_view', label: 'View' },
    ],
  },
];

export default function UsersManagement() {
  const { token, isAdmin } = useAuth();
  const authConfig = () => ({ headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    role: 'onlyuser',
    fullName: '',
    email: '',
    permissions: []
  });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    role: '',
    fullName: '',
    email: '',
    permissions: [],
    password: '',
    confirmPassword: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', authConfig());
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast.error('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e, target = 'new') => {
    const { name, value, type, checked } = e.target;
    if (target === 'new') {
      if (type === 'checkbox') {
        setNewUser(prev => ({
          ...prev,
          permissions: checked 
            ? [...prev.permissions, value] 
            : prev.permissions.filter(p => p !== value)
        }));
      } else {
        setNewUser(prev => ({ ...prev, [name]: value }));
      }
    } else {
      if (type === 'checkbox') {
        setEditUserForm(prev => ({
          ...prev,
          permissions: checked 
            ? [...prev.permissions, value] 
            : prev.permissions.filter(p => p !== value)
        }));
      } else {
        setEditUserForm(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', {
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        fullName: newUser.fullName,
        email: newUser.email,
        permissions: newUser.permissions
      }, authConfig());
      toast.success('User created');
      setNewUser({ username: '', password: '', confirmPassword: '', role: 'onlyuser', fullName: '', email: '', permissions: [] });
      fetchUsers();
    } catch (err) {
      console.error('Create user error', err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (editUserForm.password && editUserForm.password !== editUserForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put(`/users/${editingUser._id}`, {
        role: editUserForm.role,
        fullName: editUserForm.fullName,
        email: editUserForm.email,
        permissions: editUserForm.permissions,
        ...(editUserForm.password ? { password: editUserForm.password } : {})
      }, authConfig());
      toast.success('User updated');
      setEditingUser(null);
      setEditUserForm({
        role: '',
        fullName: '',
        email: '',
        permissions: [],
        password: '',
        confirmPassword: ''
      });
      fetchUsers();
    } catch (err) {
      console.error('Update user error', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async userId => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`, authConfig());
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditUserForm({
      role: user.role,
      fullName: user.fullName || '',
      email: user.email || '',
      permissions: user.permissions || [],
      password: '',
      confirmPassword: ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditUserForm({
      role: '',
      fullName: '',
      email: '',
      permissions: [],
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title"><i className="fas fa-users" /> User Management</span>
        <span className="admin-panel-count">{users.length} users</span>
      </div>

      {/* Create User Form */}
      <form className="admin-add-user" onSubmit={handleCreate}>
        <div className="user-form-grid">
          <input
            type="text"
            name="username"
            placeholder="Username *"
            className="admin-input"
            value={newUser.username}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="admin-input"
            value={newUser.fullName}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="admin-input"
            value={newUser.email}
            onChange={handleInputChange}
          />
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="New password *"
              className="admin-input"
              value={newUser.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
            >
              <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
            </button>
          </div>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password *"
              className="admin-input"
              value={newUser.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle-btn"
            >
              <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
            </button>
          </div>
          <select
            name="role"
            className="admin-select role-select"
            value={newUser.role}
            onChange={handleInputChange}
          >
            <option value="onlyuser">Onlyuser</option>
            <option value="user">User</option>
            {isAdmin && <option value="admin">Admin</option>}
          </select>
        </div>

        {/* Permissions Checkboxes */}
        <div className="permissions-section">
          <h3 className="permissions-title">Assign Permissions</h3>
          <div className="permissions-grid">
            {PERMISSION_GROUPS.map(group => (
              <div key={group.name} className="permission-group">
                <h4 className="permission-group-title">{group.name}</h4>
                {group.permissions.map(perm => (
                  <label key={perm.value} className="permission-checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={perm.value}
                      checked={newUser.permissions.includes(perm.value)}
                      onChange={handleInputChange}
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary create-user-btn" disabled={creating}>
          {creating ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus" />} Create User
        </button>
      </form>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close-btn" onClick={cancelEdit}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="user-form-grid">
                <div className="admin-input disabled">{editingUser.username}</div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="admin-input"
                  value={editUserForm.fullName}
                  onChange={(e) => handleInputChange(e, 'edit')}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="admin-input"
                  value={editUserForm.email}
                  onChange={(e) => handleInputChange(e, 'edit')}
                />
                <select
                  name="role"
                  className="admin-select role-select"
                  value={editUserForm.role}
                  onChange={(e) => handleInputChange(e, 'edit')}
                >
                  <option value="onlyuser">Onlyuser</option>
                  <option value="user">User</option>
                  {isAdmin && <option value="admin">Admin</option>}
                </select>
                <div className="password-input-wrapper">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    name="password"
                    placeholder="New password (leave empty to keep current)"
                    className="admin-input"
                    value={editUserForm.password}
                    onChange={(e) => handleInputChange(e, 'edit')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="password-toggle-btn"
                  >
                    <i className={showEditPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showEditConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    className="admin-input"
                    value={editUserForm.confirmPassword}
                    onChange={(e) => handleInputChange(e, 'edit')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    <i className={showEditConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
                  </button>
                </div>
              </div>

              <div className="permissions-section">
                <h3 className="permissions-title">Permissions</h3>
                <div className="permissions-grid">
                  {PERMISSION_GROUPS.map(group => (
                    <div key={group.name} className="permission-group">
                      <h4 className="permission-group-title">{group.name}</h4>
                      {group.permissions.map(perm => (
                        <label key={perm.value} className="permission-checkbox-label">
                          <input
                            type="checkbox"
                            name="permissions"
                            value={perm.value}
                            checked={editUserForm.permissions.includes(perm.value)}
                            onChange={(e) => handleInputChange(e, 'edit')}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                <button className="btn-primary" onClick={handleEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading users...</p></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No users found.</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.fullName || '-'}</td>
                  <td>{u.email || '-'}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.permissions && u.permissions.length > 0 
                      ? u.permissions.join(', ') 
                      : 'None'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="admin-action-btn edit" onClick={() => startEdit(u)} title="Edit User">
                      <i className="fas fa-edit" />
                    </button>
                    <button className="admin-action-btn delete" onClick={() => handleDelete(u._id)} title="Delete User">
                      <i className="fas fa-trash-alt" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
