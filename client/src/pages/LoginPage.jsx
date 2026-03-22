import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { loginUser, clearError } from '../store/slices/authSlice';
import { Icon, Badge } from '../components/ui';

const DEMO_USERS = [
  { name: 'Arjun Mehta',  role: 'admin',      email: 'admin@manufos.com',  password: 'admin123', color: '#7C3AED' },
  { name: 'Priya Sharma', role: 'supervisor',  email: 'priya@manufos.com',  password: 'super123', color: '#2563EB' },
  { name: 'Rahul Verma',  role: 'user',        email: 'rahul@manufos.com',  password: 'user123',  color: '#059669' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please enter email and password'); return; }
    dispatch(loginUser(form));
  };

  const quickLogin = (u) => dispatch(loginUser({ email: u.email, password: u.password }));

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(37,99,235,.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="logo-mark"><Icon name="package" size={18} /></div>
          <div className="logo-text">Manufacture<span>OS</span></div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-.02em' }}>Welcome back</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 28 }}>Sign in to your ERP workspace</div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ height: 42, justifyContent: 'center', marginBottom: 28 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* Demo users */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Quick demo login
        </div>
        {DEMO_USERS.map(u => (
          <div key={u.email} className="demo-chip" onClick={() => quickLogin(u)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {u.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
            </div>
            <Badge status={u.role} />
          </div>
        ))}
      </div>
    </div>
  );
}
