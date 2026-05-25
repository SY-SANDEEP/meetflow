import React from 'react';

// ── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' }[size];
  return (
    <div className={`${s} ${className} rounded-full border-brand-500/30 border-t-brand-500 animate-spin`} />
  );
};

// ── Full-page loader ──────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="text-center space-y-4">
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 rounded-full border-[3px] border-brand-500/20" />
        <div className="absolute inset-0 rounded-full border-[3px] border-t-brand-500 animate-spin" />
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide">Loading MeetFlow…</p>
    </div>
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} card shadow-2xl shadow-black/50 animate-slide-up`}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-hover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    available:   'badge-available',
    booked:      'badge-booked',
    confirmed:   'badge-confirmed',
    cancelled:   'badge-cancelled',
    completed:   'badge-completed',
    rescheduled: 'badge-rescheduled',
    pending:     'badge-pending',
  };
  return <span className={map[status] || 'badge-pending'}>{status}</span>;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, sub, color = 'brand' }) => {
  const colors = {
    brand:   'from-brand-500/20 to-brand-600/10 border-brand-500/20   text-brand-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    amber:   'from-amber-500/20 to-amber-600/10 border-amber-500/20   text-amber-400',
    red:     'from-red-500/20 to-red-600/10 border-red-500/20         text-red-400',
    cyan:    'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20       text-cyan-400',
    violet:  'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400',
  };
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-2xl ${colors[color].split(' ').pop()}`}>{icon}</span>
        {sub && <span className="text-xs text-slate-500 bg-surface/60 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-100">{value ?? '—'}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title = 'Nothing here yet', description = '', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
    <span className="text-5xl">{icon}</span>
    <div>
      <p className="text-lg font-semibold text-slate-300">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-slate-300 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
    </div>
  </Modal>
);

// ── Form Input ────────────────────────────────────────────────────────────────
export const FormInput = ({ label, error, ...props }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <input className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} {...props} />
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export const FormTextarea = ({ label, error, ...props }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <textarea className={`input resize-none ${error ? 'border-red-500' : ''}`} {...props} />
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export const FormSelect = ({ label, error, children, ...props }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <select className={`input ${error ? 'border-red-500' : ''}`} {...props}>{children}</select>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
      <span className="text-slate-400 text-sm px-3">Page {page} of {pages}</span>
      <button disabled={page === pages} onClick={() => onChange(page + 1)}
        className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
    </div>
  );
};
