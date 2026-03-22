import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchMe } from './store/slices/authSlice';
import { fetchTasks } from './store/slices/tasksSlice';
import './index.css';

import Sidebar   from './components/layout/Sidebar';
import Topbar    from './components/layout/Topbar';

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

const PAGES = {
  dashboard:  <DashboardPage/>,
  production: <ProductionPage/>,
  inventory:  <InventoryPage/>,
  bom:        <BOMPage/>,
  tasks:      <TasksPage/>,
  purchase:   <PurchasePage/>,
  machines:   <MachinePage/>,
  shifts:     <ShiftsPage/>,
  billing:    <BillingPage/>,
  reports:    <ReportsPage/>,
  users:      <UsersPage/>,
};

function LoadingScreen() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,background:'linear-gradient(135deg,#2563EB,#7C3AED)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 9.4L7.55 4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <div style={{fontSize:14,color:'var(--text-secondary)'}}>Loading ManufactureOS…</div>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { user, token, initialized } = useSelector(s => s.auth);
  const { items: tasks } = useSelector(s => s.tasks);

  const [page,      setPage]      = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { if (token) dispatch(fetchMe()); }, []);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchTasks());

    // Socket.io — listen for real-time notifications
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socket.on('notification:new', (notif) => {
      toast(notif.title + ': ' + notif.message, {
        icon: notif.type === 'danger' ? '🚨' : notif.type === 'success' ? '✅' : 'ℹ️',
        duration: 5000,
      });
    });
    socket.on('alert:low_stock', (data) => {
      toast.error(`Low stock alert: ${data.name} (${data.stock} units left)`);
    });
    return () => socket.disconnect();
  }, [user]);

  if (token && !initialized) return <LoadingScreen/>;

  if (!user) return (
    <>
      <Toaster position="top-right" toastOptions={{style:{fontFamily:'DM Sans',fontSize:13.5,borderRadius:10}}}/>
      <LoginPage/>
    </>
  );

  const safePage = user && ACCESS[page]?.includes(user.role) ? page : 'dashboard';
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  return (
    <>
      <Toaster position="top-right" toastOptions={{style:{fontFamily:'DM Sans',fontSize:13.5,borderRadius:10},duration:3500}}/>
      <div className="layout">
        <Sidebar current={safePage} onNav={setPage} user={user} collapsed={collapsed} pendingTasks={pendingTasks}/>
        <div className="main-area">
          <Topbar current={safePage} user={user} collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)} onNav={setPage}/>
          <main className="page-content">
            {PAGES[safePage]}
          </main>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
