import React, { useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function Exports() {
  const [downloading, setDownloading] = useState(null);

  const handleExport = async (type) => {
    setDownloading(type);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/reports/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const disposition = res.headers['content-disposition'];
      let filename = `${type}_export.csv`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export successful');
    } catch (err) {
      toast.error('Failed to export data');
    } finally {
      setDownloading(null);
    }
  };

  const exportTypes = [
    { type: 'users', title: 'Users List', desc: 'Export all users and basic profile info.', icon: 'fas fa-users' },
    { type: 'roles', title: 'Roles List', desc: 'Export all roles and their configurations.', icon: 'fas fa-user-shield' },
    { type: 'permissions', title: 'Permission Matrix', desc: 'Export a matrix mapping roles to permissions.', icon: 'fas fa-key' },
    { type: 'activity', title: 'Activity Report', desc: 'Export user activity scores and statistics.', icon: 'fas fa-chart-line' },
    { type: 'audit', title: 'Audit Logs', desc: 'Export the most recent 1000 system audit logs.', icon: 'fas fa-history' },
    { type: 'status', title: 'Status Report', desc: 'Export users by their active/suspended status.', icon: 'fas fa-user-check' },
  ];

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title">
          <i className="fas fa-download"></i> Data Exports
        </span>
        <span className="admin-panel-count">CSV format</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '10px 0' }}>
        {exportTypes.map(item => (
          <div key={item.type} style={{
            background: 'var(--card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              background: 'rgba(247,168,77,0.15)', color: '#f7a84d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              <i className={item.icon} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
            <button
              className="btn-saffron-gradient"
              onClick={() => handleExport(item.type)}
              disabled={downloading === item.type}
              style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
            >
              {downloading === item.type ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-file-csv" />}
              {downloading === item.type ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
