import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function UsersManagement() {
  const { token, isAdmin } = useAuth();
  const authConfig = () => ({ headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', confirmPassword: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
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
      }, authConfig());
      toast.success('User created');
      setNewUser({ username: '', password: '', confirmPassword: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      console.error('Create user error', err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
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

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title"><i className="fas fa-users" /> User Management</span>
        <span className="admin-panel-count">{users.length} users</span>
      </div>

      {/* Create User Form */}
      <form className="admin-add-user" onSubmit={handleCreate}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="admin-input"
          value={newUser.username}
          onChange={handleInputChange}
          required
        />
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="New password"
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
            placeholder="Confirm password"
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
          {isAdmin && <option value="admin">Admin</option>}
        </select>
        <button type="submit" className="btn-primary create-user-btn" disabled={creating}>
          {creating ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus" />} Create
        </button>
      </form>

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
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td style={{ textAlign: 'right' }}>
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
