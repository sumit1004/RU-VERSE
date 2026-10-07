import React, { useState, useEffect, useCallback } from 'react';
import auditService from '../../services/auditService.js';
import '../../styles/admin.css';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Selected Log Details Modal
  const [activeLog, setActiveLog] = useState(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditService.getAuditLogs({
        search: search.trim() || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        page,
        limit,
      });

      setLogs(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [search, action, entityType, page, limit]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const getActionBadgeColor = (act) => {
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('DEACTIVATED') || act.includes('FAILED')) {
      return 'archived';
    }
    if (act.includes('CREATE') || act.includes('SUCCESS') || act.includes('PUBLISHED')) {
      return 'published';
    }
    return 'upcoming';
  };

  return (
    <div className="admin-events-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Audit Trails & Logs</h1>
          <p className="admin-page-desc">
            Immutable security records of administrative changes, logins, and event operations
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-notification error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="admin-card admin-filters-card" style={{ marginBottom: '24px' }}>
        <div className="admin-filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Search Logs</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Action, entity, actor, IP..."
              className="admin-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Action Filter</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="EVENT_CREATED">EVENT_CREATED</option>
              <option value="EVENT_UPDATED">EVENT_UPDATED</option>
              <option value="EVENT_PUBLISHED">EVENT_PUBLISHED</option>
              <option value="EVENT_ARCHIVED">EVENT_ARCHIVED</option>
              <option value="FORM_PUBLISHED">FORM_PUBLISHED</option>
              <option value="REGISTRATION_STATUS_CHANGED">REGISTRATION_STATUS_CHANGED</option>
              <option value="REGISTRATION_CANCELLED">REGISTRATION_CANCELLED</option>
              <option value="COORDINATOR_CREATED">COORDINATOR_CREATED</option>
              <option value="COORDINATOR_UPDATED">COORDINATOR_UPDATED</option>
              <option value="COORDINATOR_DEACTIVATED">COORDINATOR_DEACTIVATED</option>
              <option value="COORDINATOR_PERMISSIONS_UPDATED">COORDINATOR_PERMISSIONS_UPDATED</option>
              <option value="COORDINATOR_EVENTS_UPDATED">COORDINATOR_EVENTS_UPDATED</option>
            </select>
          </div>

          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="">All Entities</option>
              <option value="USER">USER</option>
              <option value="EVENT">EVENT</option>
              <option value="FORM">FORM</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="COORDINATOR">COORDINATOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📜</div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Audit Logs Recorded</h3>
            <p style={{ color: 'var(--admin-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              No audit logs matched your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>IP Address</th>
                    <th style={{ textAlign: 'right' }}>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td>
                        {log.actor ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{log.actor.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>
                              {log.actor.email} ({log.actor.role?.slug})
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--admin-text-dim)', fontStyle: 'italic' }}>System / Public</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-status-badge ${getActionBadgeColor(log.action)}`} style={{ fontSize: '0.72rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>
                          {log.entityType || '—'} {log.entityId ? `#${log.entityId}` : ''}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-dim)', fontFamily: 'monospace' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {log.metadataJson ? (
                          <button
                            type="button"
                            onClick={() => setActiveLog(log)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            style={{ fontSize: '0.78rem' }}
                          >
                            <span>Inspect JSON</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--admin-text-dim)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  Page {page} of {totalPages}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <span>← Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Metadata Inspector Modal */}
      {activeLog && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', margin: 0 }}>Audit Context Payload</h3>
              <span className={`admin-status-badge ${getActionBadgeColor(activeLog.action)}`}>
                {activeLog.action}
              </span>
            </div>

            <div style={{ background: '#0a0d14', border: '1px solid var(--admin-border-subtle)', borderRadius: '8px', padding: '16px', overflowX: 'auto', marginBottom: '20px' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8' }}>
                {JSON.stringify(activeLog.metadataJson, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="admin-btn admin-btn-primary"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
