import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;

  const isError = toast.type === 'error' || toast.type === 'danger';

  return (
    <div className="admin-toast-container">
      <div className={`admin-toast ${isError ? 'admin-toast-error' : 'admin-toast-success'}`}>
        <span>{isError ? '⚠️' : '✓'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
