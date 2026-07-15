import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/reports/audit-logs?page=${pageNum}&limit=15&search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs);
      setTotalPages(Math.ceil(res.data.total / res.data.limit) || 1);
      setPage(res.data.page);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]); // eslint-disable-line

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span className="admin-panel-title">
          <i className="fas fa-history"></i> System Audit Logs
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '10px 14px 10px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                width: '250px'
              }}
            />
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button onClick={() => fetchLogs(page)} className="btn-ghost" title="Refresh">
            <i className="fas fa-sync-alt" />
          </button>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading logs...</p></div>
      ) : logs.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No audit logs found.</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Module</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td className="admin-td-muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.user}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(247,168,77,0.15)', color: '#f7a84d'
                    }}>
                      {log.role}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{log.module}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      background: log.action === 'create' ? 'rgba(16,185,129,0.15)' :
                                  log.action === 'update' ? 'rgba(66,153,225,0.15)' :
                                  log.action === 'delete' ? 'rgba(229,62,62,0.15)' : 'rgba(160,160,160,0.15)',
                      color: log.action === 'create' ? '#10b981' :
                             log.action === 'update' ? '#3182ce' :
                             log.action === 'delete' ? '#e53e3e' : '#a0aec0',
                      textTransform: 'uppercase'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="admin-td-muted" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(log.updatedData || log.previousData)}>
                    {log.action === 'update' ? 'Modified fields' : (log.action === 'delete' ? 'Removed record' : 'Created record')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page === 1}
            className="btn-ghost"
            style={{ padding: '8px 16px' }}
          >
            <i className="fas fa-chevron-left" /> Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={page === totalPages}
            className="btn-ghost"
            style={{ padding: '8px 16px' }}
          >
            Next <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
