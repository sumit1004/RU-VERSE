import React from 'react';

/**
 * Reusable StatusBadge component for consistent status indicators
 * Handles: CONFIRMED, ACTIVE, PUBLISHED, PENDING, WAITLISTED, CANCELLED, REJECTED, INACTIVE, DRAFT, ARCHIVED
 */
export default function StatusBadge({ status, label }) {
  if (!status) return null;

  const raw = String(status).toUpperCase();
  const displayLabel = label || raw.replace(/_/g, ' ');

  let typeClass = 'admin-badge-neutral';

  if (['CONFIRMED', 'ACTIVE', 'PUBLISHED', 'COMPLETED', 'SUCCESS'].includes(raw)) {
    typeClass = 'admin-badge-success';
  } else if (['PENDING', 'WAITLISTED', 'WARNING'].includes(raw)) {
    typeClass = 'admin-badge-warning';
  } else if (['CANCELLED', 'REJECTED', 'INACTIVE', 'DANGER'].includes(raw)) {
    typeClass = 'admin-badge-danger';
  } else if (['TEAM', 'INDIVIDUAL', 'INFO', 'EXTERNAL', 'INTERNAL'].includes(raw)) {
    typeClass = 'admin-badge-info';
  }

  return (
    <span className={`admin-badge ${typeClass}`}>
      <span className="admin-badge-dot" />
      <span>{displayLabel}</span>
    </span>
  );
}
