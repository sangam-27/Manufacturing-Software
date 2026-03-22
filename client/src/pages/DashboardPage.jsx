import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../services/api';
import { Icon, Badge, KpiCard, ProgressBar, Skeleton, fmt } from '../components/ui';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PIE_COLORS  = ['#2563EB','#7C3AED','#0891B2','#059669','#D97706','#F04438'];

export default function DashboardPage() {
  const { user } = useSelector(s => s.auth);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {};

  const salesChart = (data?.charts.monthlySales || []).map(d => ({
    month: MONTH_NAMES[(d._id.month || 1) - 1],
    revenue: d.revenue,
    orders: d.orders,
  }));

  const prodChart = (data?.charts.weeklyProduction || []).map(d => ({
    day: DAY_NAMES[((d._id || 1) - 1) % 7],
    completed: d.completed,
    planned: d.planned,
  }));

  const catChart = (data?.charts.categoryDistribution || []).map((c, i) => ({
    name: c._id, value: c.count, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div>
      <div className="page-header" style={{ display: 'block' }}>
        <div className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</div>
        <div className="page-subtitle">Here's what's happening in your factory today</div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        <KpiCard label="Total Revenue" value={loading ? '—' : fmt.currency(kpis.totalRevenue)} change={`${kpis.revenueGrowth > 0 ? '+' : ''}${kpis.revenueGrowth || 0}% vs last month`} changeDir={kpis.revenueGrowth >= 0 ? 'up' : 'down'} icon="dollar" iconColor="#2563EB" iconBg="var(--primary-light)" loading={loading} />
        <KpiCard label="Active Orders" value={loading ? '—' : kpis.activeOrders} change={`${kpis.pendingOrders} pending`} changeDir="up" icon="production" iconColor="#7C3AED" iconBg="var(--purple-light)" loading={loading} />
        <KpiCard label="Inventory Items" value={loading ? '—' : kpis.totalProducts} change={`${kpis.lowStockCount} low stock`} changeDir={kpis.lowStockCount > 0 ? 'down' : 'up'} icon="package" iconColor="#F79009" iconBg="var(--warning-light)" loading={loading} />
        <KpiCard label="Open Invoices" value={loading ? '—' : kpis.pendingInvoices + kpis.overdueInvoices} change={`${kpis.overdueInvoices} overdue`} changeDir={kpis.overdueInvoices > 0 ? 'down' : 'up'} icon="billing" iconColor="#F04438" iconBg="var(--danger-light)" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-4">
        {/* Revenue chart */}
        <div className="card card-p">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Revenue Trend</div>
              <div className="text-sm text-muted">Last 6 months</div>
            </div>
            {!loading && kpis.revenueGrowth !== undefined && (
              <span className={`badge ${kpis.revenueGrowth >= 0 ? 'badge-success' : 'badge-danger'}`}>
                <span className="badge-dot" />{kpis.revenueGrowth >= 0 ? '+' : ''}{kpis.revenueGrowth}%
              </span>
            )}
          </div>
          {loading ? <Skeleton height={200} /> : salesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF1F5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={v => [fmt.currency(v), 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sales data yet</div>
          )}
        </div>

        {/* Production chart */}
        <div className="card card-p">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Production This Week</div>
              <div className="text-sm text-muted">Planned vs completed</div>
            </div>
          </div>
          {loading ? <Skeleton height={200} /> : prodChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={prodChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF1F5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                <Bar dataKey="planned"   name="Planned"   fill="#EFF1F5"   radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#2563EB"   radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No production data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Recent orders */}
        <div className="card card-p">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Recent Production Orders</div>
          {loading ? Array(4).fill(0).map((_, i) => <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}><Skeleton height={12} width="30%" /><Skeleton height={12} width="40%" /><Skeleton height={12} width="20%" /></div>) :
            data?.recent.orders.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No orders yet</div> :
            data?.recent.orders.map(o => (
              <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.orderId}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.product?.name}</div>
                </div>
                <div style={{ width: 90 }}>
                  <ProgressBar value={o.progress} />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>{o.progress}%</div>
                </div>
                <Badge status={o.status} />
              </div>
            ))
          }
        </div>

        {/* Category Pie + stats */}
        <div className="card card-p">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Inventory by Category</div>
          {loading ? <Skeleton height={180} /> : catChart.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catChart} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {catChart.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [v + ' products', p.payload.name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {catChart.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, flex: 1, color: 'var(--text-secondary)' }}>{c.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No products yet</div>}
        </div>
      </div>
    </div>
  );
}
