import React from 'react';

// ── Icon component ────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:    `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  production:   `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  inventory:    `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`,
  billing:      `<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
  users:        `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>`,
  tasks:        `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>`,
  search:       `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  bell:         `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>`,
  settings:     `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>`,
  logout:       `<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  menu:         `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`,
  x:            `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  plus:         `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  edit:         `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  trash:        `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>`,
  eye:          `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  download:     `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  check:        `<polyline points="20 6 9 17 4 12"/>`,
  package:      `<path d="M16.5 9.4L7.55 4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  alert:        `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  dollar:       `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>`,
  arrow_up:     `<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>`,
  arrow_down:   `<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>`,
  refresh:      `<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>`,
  filter:       `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
  chart:        `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  chevron_right:`<polyline points="9 18 15 12 9 6"/>`,
  chevron_left: `<polyline points="15 18 9 12 15 6"/>`,
  clock:        `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  user:         `<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  tag:          `<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,
  trending_up:  `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  clipboard:    `<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>`,
  layers:       `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
  activity:     `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
};

export const Icon = ({ name, size = 16, style = {}, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}
    dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
  />
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  active:       { cls: 'badge-success', label: 'Active' },
  inactive:     { cls: 'badge-gray',    label: 'Inactive' },
  in_progress:  { cls: 'badge-primary', label: 'In Progress' },
  pending:      { cls: 'badge-warning', label: 'Pending' },
  completed:    { cls: 'badge-success', label: 'Completed' },
  on_hold:      { cls: 'badge-gray',    label: 'On Hold' },
  cancelled:    { cls: 'badge-danger',  label: 'Cancelled' },
  paid:         { cls: 'badge-success', label: 'Paid' },
  overdue:      { cls: 'badge-danger',  label: 'Overdue' },
  draft:        { cls: 'badge-gray',    label: 'Draft' },
  low_stock:    { cls: 'badge-warning', label: 'Low Stock' },
  out_of_stock: { cls: 'badge-danger',  label: 'Out of Stock' },
  high:         { cls: 'badge-danger',  label: 'High' },
  medium:       { cls: 'badge-warning', label: 'Medium' },
  low:          { cls: 'badge-primary', label: 'Low' },
  todo:         { cls: 'badge-gray',    label: 'To Do' },
  done:         { cls: 'badge-success', label: 'Done' },
  admin:        { cls: 'badge-purple',  label: 'Admin' },
  supervisor:   { cls: 'badge-primary', label: 'Supervisor' },
  user:         { cls: 'badge-gray',    label: 'Worker' },
};

export const Badge = ({ status, label: customLabel }) => {
  const item = BADGE_MAP[status] || { cls: 'badge-gray', label: status };
  return (
    <span className={`badge ${item.cls}`}>
      <span className="badge-dot" />
      {customLabel || item.label}
    </span>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }) => {
  if (!isOpen) return null;
  const maxW = size === 'lg' ? 680 : size === 'sm' ? 400 : 520;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, color }) => {
  const c = color || (value === 100 ? 'var(--success)' : value > 50 ? 'var(--primary)' : 'var(--warning)');
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%`, background: c }} />
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = 16, className = '' }) => (
  <div className={`skeleton ${className}`} style={{ width, height }} />
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div style={{ padding: '0 16px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
        {Array.from({ length: cols }).map((_, j) => <Skeleton key={j} height={12} />)}
      </div>
    ))}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = 'package', title = 'No data found', description = 'Try adjusting your filters or add a new item.', action }) => (
  <div className="empty-state">
    <div className="empty-icon"><Icon name={icon} size={22} /></div>
    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: action ? 16 : 0 }}>{description}</div>
    {action}
  </div>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '', size = 32, role }) => {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bg = role === 'admin' ? 'linear-gradient(135deg,#7C3AED,#2563EB)' : role === 'supervisor' ? 'linear-gradient(135deg,#2563EB,#0891B2)' : 'linear-gradient(135deg,#059669,#0891B2)';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initials || '?'}
    </div>
  );
};

// ── Confirm dialog ────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
    footer={
      <>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Confirm'}
        </button>
      </>
    }>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message || 'Are you sure you want to proceed? This action cannot be undone.'}</p>
  </Modal>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
export const KpiCard = ({ label, value, change, changeDir = 'up', icon, iconColor, iconBg, loading }) => (
  <div className="kpi-card" style={{ overflow: 'hidden' }}>
    {/* Top row: label + icon side by side — no absolute positioning */}
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 10,
    }}>
      <div className="kpi-label" style={{ margin: 0, flex: 1, minWidth: 0 }}>{label}</div>
      {icon && (
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-md)',
          background: iconBg || 'var(--primary-light)',
          color: iconColor || 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={icon} size={16} />
        </div>
      )}
    </div>
    {loading
      ? <Skeleton height={26} width="60%" />
      : <div className="kpi-value">{value}</div>
    }
    {change && (
      <div className={`kpi-change ${changeDir}`}>
        <Icon name={changeDir === 'up' ? 'arrow_up' : 'arrow_down'} size={11} />
        {change}
      </div>
    )}
  </div>
);

// ── Table toolbar ─────────────────────────────────────────────────────────────
export const TableToolbar = ({ title, children }) => (
  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
    <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onPage(page - 1)} disabled={page === 1}><Icon name="chevron_left" size={14} /></button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} className={`btn btn-sm btn-icon ${p === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onPage(p)} style={{ width: 30 }}>{p}</button>
      ))}
      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onPage(page + 1)} disabled={page === pages}><Icon name="chevron_right" size={14} /></button>
    </div>
  );
};

// ── fmt helpers ───────────────────────────────────────────────────────────────
export const fmt = {
  currency: (n) => '₹' + Number(n || 0).toLocaleString('en-IN'),
  date:     (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  dateShort:(d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
  timeAgo:  (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  },
};
