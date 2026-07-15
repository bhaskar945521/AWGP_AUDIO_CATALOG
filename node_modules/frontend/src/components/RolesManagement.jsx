import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

const PERMISSION_GROUPS = [
  {
    name: 'Audio Library',
    icon: 'fas fa-music',
    permissions: [
      { value: 'audios_view',     label: 'View / Listen' },
      { value: 'audios_create',   label: 'Upload' },
      { value: 'audios_update',   label: 'Edit' },
      { value: 'audios_delete',   label: 'Delete (Soft)' },
      { value: 'audios_download', label: 'Download' },
      { value: 'audios_print',    label: 'Print Details' },
    ],
  },
  {
    name: 'Categories',
    icon: 'fas fa-tags',
    permissions: [
      { value: 'categories_view',   label: 'View' },
      { value: 'categories_create', label: 'Create' },
      { value: 'categories_update', label: 'Edit' },
      { value: 'categories_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Albums',
    icon: 'fas fa-compact-disc',
    permissions: [
      { value: 'albums_view',   label: 'View' },
      { value: 'albums_create', label: 'Create' },
      { value: 'albums_update', label: 'Edit' },
      { value: 'albums_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Users',
    icon: 'fas fa-users',
    permissions: [
      { value: 'users_read',   label: 'View' },
      { value: 'users_create', label: 'Create' },
      { value: 'users_update', label: 'Edit' },
      { value: 'users_delete', label: 'Delete' },
    ],
  },
  {
    name: 'Roles',
    icon: 'fas fa-user-shield',
    permissions: [
      { value: 'roles_read',   label: 'View' },
      { value: 'roles_create', label: 'Create' },
      { value: 'roles_update', label: 'Edit' },
      { value: 'roles_delete', label: 'Delete' },
    ],
  },
  {
    name: 'System',
    icon: 'fas fa-cogs',
    permissions: [
      { value: 'logs_read',   label: 'Audit Logs' },
      { value: 'analytics_view', label: 'Analytics' },
      { value: 'settings_update', label: 'Settings' },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.value));

export default function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    displayName: '',
    permissions: [],
    enabled: true
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (val) => {
    setForm(prev => {
      const perms = prev.permissions.includes(val)
        ? prev.permissions.filter(p => p !== val)
        : [...prev.permissions, val];
      return { ...prev, permissions: perms };
    });
  };

  const handleSelectGroup = (groupPerms, selectAll) => {
    setForm(prev => {
      let newPerms = [...prev.permissions];
      if (selectAll) {
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
      } else {
        newPerms = newPerms.filter(p => !groupPerms.includes(p));
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const startCreate = () => {
    setForm({ name: '', displayName: '', permissions: [], enabled: true });
    setEditingRole(null);
    setIsCreating(true);
  };

  const startEdit = (role) => {
    if (role.isSystem && role.name === 'admin') {
      toast.error('Cannot edit core admin role');
      return;
    }
    setForm({
      name: role.name,
      displayName: role.displayName,
      permissions: role.permissions,
      enabled: role.enabled
    });
    setEditingRole(role);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim() || (!editingRole && !form.name.trim())) {
      return toast.error('Role Name and Display Name are required');
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, form, { headers });
        toast.success('Role updated');
      } else {
        // Automatically make name lowercase and snake_case
        const payload = {
          ...form,
          name: form.name.trim().toLowerCase().replace(/\s+/g, '_')
        };
        await api.post('/roles', payload, { headers });
        toast.success('Role created');
      }
      cancelEdit();
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystem) return toast.error('Cannot delete system role');
    if (!window.confirm(`Delete role "${role.displayName}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/roles/${role._id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid var(--border)', background: 'var(--card-bg, rgba(255,255,255,0.04))',
    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none'
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="admin-panel-title">
          <i className="fas fa-user-shield"></i> Roles & Permissions
        </span>
        {!isCreating && !editingRole && (
          <button className="btn-saffron-gradient" onClick={startCreate}>
            <i className="fas fa-plus"></i> New Role
          </button>
        )}
      </div>

      {(isCreating || editingRole) && (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--card-bg, rgba(255,255,255,0.03))',
          border: '1.5px solid var(--border)', borderRadius: '16px',
          padding: '24px', marginBottom: '28px',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-main)' }}>
            {editingRole ? `Edit Role: ${editingRole.displayName}` : 'Create New Role'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Display Name *</label>
              <input style={inputStyle} type="text" placeholder="e.g. Content Manager" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Internal Identifier {editingRole && '(Cannot edit)'}</label>
              <input style={inputStyle} type="text" placeholder="e.g. content_manager" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!!editingRole} required={!editingRole} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="role-enabled" checked={form.enabled} onChange={e => setForm(p => ({ ...p, enabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <label htmlFor="role-enabled" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>Role is active and assignable</label>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>Permissions Matrix</h4>
              <button type="button" className="btn-ghost" onClick={() => setForm(p => ({ ...p, permissions: p.permissions.length === ALL_PERMISSIONS.length ? [] : ALL_PERMISSIONS }))}>
                {form.permissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {PERMISSION_GROUPS.map(group => {
                const groupVals = group.permissions.map(p => p.value);
                const allSelected = groupVals.every(v => form.permissions.includes(v));
                const someSelected = groupVals.some(v => form.permissions.includes(v)) && !allSelected;
                
                return (
                  <div key={group.name} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--border-saffron, rgba(247,168,77,0.1))', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <i className={group.icon} style={{ marginRight: 8, color: 'var(--saffron)' }} />
                        {group.name}
                      </span>
                      <input type="checkbox" checked={allSelected} ref={el => { if(el) el.indeterminate = someSelected; }} onChange={e => handleSelectGroup(groupVals, e.target.checked)} />
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.permissions.map(p => (
                        <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.permissions.includes(p.value)} onChange={() => handleTogglePermission(p.value)} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
            <button type="submit" className="btn-saffron-gradient">
              <i className="fas fa-save" /> Save Role
            </button>
          </div>
        </form>
      )}

      {loading && roles.length === 0 ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading roles...</p></div>
      ) : roles.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No roles found.</p></div>
      ) : !isCreating && !editingRole && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roles.map(role => (
            <div key={role._id} style={{
              display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
              padding: '16px 20px', borderRadius: '14px',
              background: 'var(--card-bg, rgba(255,255,255,0.03))',
              border: '1.5px solid var(--border)',
              opacity: role.enabled ? 1 : 0.6
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                background: role.isSystem ? 'rgba(229,62,62,0.15)' : 'rgba(247,168,77,0.15)',
                color: role.isSystem ? '#e53e3e' : '#f7a84d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                <i className={role.isSystem ? 'fas fa-lock' : 'fas fa-user-tag'} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{role.displayName}</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{role.name}</span>
                  {role.isSystem && <span style={{ fontSize: '0.7rem', background: '#e53e3e', color: 'white', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>System</span>}
                  {!role.enabled && <span style={{ fontSize: '0.7rem', background: '#a0aec0', color: 'white', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>Disabled</span>}
                </div>
                
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.permissions.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No permissions</span>
                  ) : role.isSystem && role.name === 'admin' ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}><i className="fas fa-check-circle" /> Full System Access</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--saffron)', fontWeight: 600 }}>{role.permissions.length} Permissions:</span>
                      {role.permissions.slice(0, 6).map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', background: 'var(--border)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                      {role.permissions.length > 6 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{role.permissions.length - 6} more</span>}
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => startEdit(role)} 
                  className="admin-action-btn edit" 
                  disabled={role.isSystem && role.name === 'admin'}
                  style={{ opacity: (role.isSystem && role.name === 'admin') ? 0.3 : 1 }}
                >
                  <i className="fas fa-edit" />
                </button>
                <button 
                  onClick={() => handleDelete(role)} 
                  className="admin-action-btn delete"
                  disabled={role.isSystem}
                  style={{ opacity: role.isSystem ? 0.3 : 1 }}
                >
                  <i className="fas fa-trash-alt" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
