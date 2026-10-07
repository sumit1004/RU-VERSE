import React, { useState, useEffect, useCallback } from 'react';
import auditService from '../../services/auditService.js';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Toast from '../../components/admin/Toast.jsx';
import '../../styles/admin.css';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Selected Log Details Modal
  const [activeLog, setActiveLog] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
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
      showToast('error', err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [search, action, entityType, page]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Audit Logs
          </h1>
          <p className="admin-page-subtitle">
            Immutable operational audit trail, security events, authentication attempts, and administrative modifications.
          </p>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="admin-metric-strip">
        <div className="admin-metric-item">
          <span>Total Log Entries:</span>
          <strong>{logs.length}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Security Record:</span>
          <strong style={{ color: 'var(--ad-success-text)' }}>Immutable Ledger Active</strong>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search action, actor, entity, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="admin-select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="EVENT_CREATED">EVENT_CREATED</option>
            <option value="EVENT_UPDATED">EVENT_UPDATED</option>
            <option value="FORM_PUBLISHED">FORM_PUBLISHED</option>
            <option value="REGISTRATION_STATUS_CHANGED">REGISTRATION_STATUS_CHANGED</option>
            <option value="COORDINATOR_CREATED">COORDINATOR_CREATED</option>
            <option value="COORDINATOR_PERMISSIONS_UPDATED">COORDINATOR_PERMISSIONS_UPDATED</option>
            <option value="COORDINATOR_EVENTS_UPDATED">COORDINATOR_EVENTS_UPDATED</option>
            <option value="EXPORT_GENERATED">EXPORT_GENERATED</option>
          </select>

          <select
            className="admin-select"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Entity Types</option>
            <option value="USER">USER</option>
            <option value="EVENT">EVENT</option>
            <option value="FORM">FORM</option>
            <option value="REGISTRATION">REGISTRATION</option>
            <option value="COORDINATOR">COORDINATOR</option>
            <option value="CATEGORY">CATEGORY</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          {(search || action || entityType) && (
            <button
              onClick={() => {
                setSearch('');
                setAction('');
                setEntityType('');
                setPage(1);
              }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
          Loading audit trails...
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <div className="admin-empty-title">No audit records found</div>
            <div className="admin-empty-desc">
              Audit log entries will appear as system actions, logins, and status transitions occur.
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actorName = log.actor?.name || log.actor?.email || 'System / Public';
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{actorName}</div>
                      {log.actor?.role && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                          {log.actor.role.name}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={log.action} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                      {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', fontFamily: 'var(--ad-font-mono)' }}>
                      {log.ipAddress || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveLog(log)}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* METADATA INSPECTOR MODAL */}
      {activeLog && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Audit Record — #{activeLog.id}</h3>
              <button onClick={() => setActiveLog(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-grid-2" style={{ marginBottom: '1rem', gap: '0.5rem 1rem' }}>
                <div>
                  <span className="admin-label">Action</span>
                  <div style={{ marginTop: '0.15rem' }}>
                    <StatusBadge status={activeLog.action} />
                  </div>
                </div>
                <div>
                  <span className="admin-label">Timestamp</span>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
                    {new Date(activeLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="admin-label">Actor</span>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
                    {activeLog.actor?.name} ({activeLog.actor?.email || 'System'})
                  </div>
                </div>
                <div>
                  <span className="admin-label">IP & User Agent</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', marginTop: '0.15rem' }}>
                    {activeLog.ipAddress || '—'} {activeLog.userAgent ? `• ${activeLog.userAgent}` : ''}
                  </div>
                </div>
              </div>

              <div>
                <span className="admin-label">Metadata Payload (JSON)</span>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '0.85rem',
                    borderRadius: 'var(--ad-radius-sm)',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    fontFamily: 'var(--ad-font-mono)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--ad-border-subtle)',
                    marginTop: '0.25rem',
                  }}
                >
                  {JSON.stringify(activeLog.metadataJson, null, 2) || '{}'}
                </pre>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
