import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Icon, Avatar } from '../ui';
import { logout } from '../../store/slices/authSlice';

const PAGE_LABELS = {
  dashboard: 'Dashboard', production: 'Production Management',
  inventory: 'Inventory', billing: 'Billing & Sales',
  users: 'User Management', tasks: 'My Tasks',
};

const MOCK_NOTIFS = [
  { id: 1, text: 'Low stock alert: Aluminum Shaft 200mm (38 units)', time: '2m ago', unread: true },
  { id: 2, text: 'PO-0003 completed by Rahul Verma', time: '1h ago', unread: true },
  { id: 3, text: 'Invoice INV-1001 is overdue', time: '3h ago', unread: false },
  { id: 4, text: 'New user Deepa Nair added to Production', time: 'Yesterday', unread: false },
];

export default function Topbar({ current, user, collapsed, onToggle, onNav }) {
  const dispatch = useDispatch();
  const [showNotif, setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = MOCK_NOTIFS.filter(n => n.unread).length;

  return (
    <header className="topbar">
      {/* Collapse toggle */}
      <button className="topbar-toggle" onClick={onToggle}>
        <Icon name="menu" size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span style={{ color: 'var(--text-muted)' }}>ManufactureOS</span>
        <span style={{ color: 'var(--text-muted)' }}>›</span>
        <span>{PAGE_LABELS[current] || current}</span>
      </div>

      {/* Search */}
      <div className="topbar-search">
        <Icon name="search" size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Search orders, products, invoices…" />
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="topbar-btn" onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}>
            <Icon name="bell" size={16} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>
          {showNotif && (
            <div className="dropdown-panel" style={{ top: 'calc(100% + 8px)', right: 0, width: 320 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                <span style={{ fontSize: 11.5, color: 'var(--primary)', cursor: 'pointer' }}>Mark all read</span>
              </div>
              {MOCK_NOTIFS.map(n => (
                <div key={n.id} className="dropdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: n.unread ? 'var(--primary-light)' : '' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono' }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button className="avatar" onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}>
            {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </button>
          {showProfile && (
            <div className="dropdown-panel" style={{ top: 'calc(100% + 8px)', right: 0, width: 220, padding: 6 }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div className="dropdown-item"><Icon name="settings" size={14} />Settings</div>
              <div className="dropdown-item danger" onClick={() => dispatch(logout())}><Icon name="logout" size={14} />Sign out</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
