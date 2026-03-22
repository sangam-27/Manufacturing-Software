import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchMe } from './store/slices/authSlice';
import { fetchTasks } from './store/slices/tasksSlice';
import './index.css';

import Sidebar from './components/layout/Sidebar';
import Topbar  from './components/layout/Topbar';

import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import ProductionPage from './pages/ProductionPage';
import InventoryPage  from './pages/InventoryPage';
import BillingPage    from './pages/BillingPage';
import UsersPage      from './pages/UsersPage';
import { TasksPage }  from './pages/TasksPage';
import ReportsPage    from './pages/ReportsPage';
import PurchasePage   from './pages/PurchasePage';
import BOMPage        from './pages/BOMPage';
import MachinePage    from './pages/MachinePage';
import ShiftsPage     from './pages/ShiftsPage';

const ACCESS = {
  dashboard:  ['admin','supervisor','user'],
  production: ['admin','supervisor','user'],
  inventory:  ['admin','supervisor'],
  bom:        ['admin','supervisor'],
  tasks:      ['admin','supervisor','user'],
  purchase:   ['admin','supervisor'],
  machines:   ['admin','supervisor'],
  shifts:     ['admin','supervisor','user'],
  billing:    ['admin'],
  reports:    ['admin'],
  users:      ['admin'],
};

function PageRenderer({ page }) {
  switch (page) {
    case 'dashboard':  return <DashboardPage />;
    case 'production': return <ProductionPage />;
    case 'inventory':  return <InventoryPage />;
    case 'bom':        return <BOMPage />;
    case 'tasks':      return <TasksPage />;
    case 'purchase':   return <PurchasePage />;
    case 'machines':   return <MachinePage />;
    case 'shifts':     return <ShiftsPage />;
    case 'billing':    return <BillingPage />;
    case 'reports':    return <ReportsPage />;
    case 'users':      return <UsersPage />;
    default:           return <DashboardPage />;
  }
}

function LoadingScreen() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,background:'linear-gradient(135deg,#2563EB,#7C3AED)',
        borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 9.4L7.55 4.24"/>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <div style={{fontSize:14,color:'var(--text-secondary)'}}>Loading ManufactureOS…</div>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--primary)',
        borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Hook: detect mobile ───────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function App() {
  const dispatch = useDispatch();
  const { user, token, initialized } = useSelector(s => s.auth);
  const { items: tasks }             = useSelector(s => s.tasks);
  const isMobile                     = useIsMobile();

  const [page,          setPage]          = useState('dashboard');
  // Desktop: collapsed/expanded | Mobile: open/closed
  const [collapsed,     setCollapsed]     = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  // ── Auth: restore session on reload ──────────────────────────────────────
  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, []); // eslint-disable-line

  // ── Socket.io + tasks after login ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    dispatch(fetchTasks());
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socket.on('notification:new', (n) => {
      toast(n.title + ': ' + n.message, {
        icon: n.type==='danger' ? '🚨' : n.type==='success' ? '✅' : 'ℹ️',
        duration: 5000,
      });
    });
    socket.on('alert:low_stock', (d) => {
      toast.error(`Low stock: ${d.name} (${d.stock} bache)`);
    });
    return () => socket.disconnect();
  }, [user]); // eslint-disable-line

  // ── Close mobile sidebar on route change ─────────────────────────────────
  const handleNav = useCallback((newPage) => {
    setPage(newPage);
    if (isMobile) setMobileOpen(false);   // nav pe click → sidebar band
  }, [isMobile]);

  // ── Toggle handler — desktop collapse, mobile open/close ─────────────────
  const handleToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  }, [isMobile]);

  // ── Close mobile sidebar on outside click (backdrop) ─────────────────────
  const handleBackdropClick = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // ── ESC key to close mobile sidebar ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // ── Prevent body scroll when mobile sidebar is open ──────────────────────
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileOpen]);

  // ── Loading screen (token present, waiting for fetchMe) ──────────────────
  if (!initialized) return <LoadingScreen />;

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Toaster position="top-right"
          toastOptions={{style:{fontFamily:'DM Sans',fontSize:13.5,borderRadius:10}}}/>
        <LoginPage />
      </>
    );
  }

  const safePage      = ACCESS[page]?.includes(user.role) ? page : 'dashboard';
  const pendingTasks  = tasks.filter(t => t.status !== 'done').length;

  // Sidebar class logic:
  // Mobile:  sidebar + (mobile-open or nothing)
  // Desktop: sidebar + (collapsed or nothing)
  const sidebarClass = isMobile
    ? `sidebar${mobileOpen ? ' mobile-open' : ''}`
    : `sidebar${collapsed  ? ' collapsed'   : ''}`;

  return (
    <>
      <Toaster position="top-right"
        toastOptions={{style:{fontFamily:'DM Sans',fontSize:13.5,borderRadius:10},duration:3500}}/>

      <div className="layout">

        {/* ── Mobile backdrop ── */}
        {isMobile && mobileOpen && (
          <div
            className="mobile-backdrop"
            onClick={handleBackdropClick}
            aria-label="Close sidebar"
          />
        )}

        {/* ── Sidebar ── */}
        <Sidebar
          sidebarClass={sidebarClass}
          current={safePage}
          onNav={handleNav}
          user={user}
          collapsed={!isMobile && collapsed}
          pendingTasks={pendingTasks}
        />

        {/* ── Main area ── */}
        <div className="main-area">
          <Topbar
            current={safePage}
            user={user}
            collapsed={collapsed}
            onToggle={handleToggle}
            onNav={handleNav}
            isMobile={isMobile}
            mobileOpen={mobileOpen}
          />
          <main className="page-content">
            <PageRenderer page={safePage} />
          </main>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
