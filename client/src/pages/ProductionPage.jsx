import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchOrders, createOrder, updateProgress, deleteOrder, updateOrder } from '../store/slices/ordersSlice';
import { fetchProducts } from '../store/slices/productsSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { Icon, Badge, Modal, ProgressBar, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, fmt } from '../components/ui';

export default function ProductionPage() {
  const dispatch = useDispatch();
  const { user }     = useSelector(s => s.auth);
  const { items: orders, total, loading } = useSelector(s => s.orders);
  const { items: products } = useSelector(s => s.products);
  const { items: users }    = useSelector(s => s.users);

  const [showCreate, setShowCreate] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [progOrder,  setProgOrder]  = useState(null);
  const [filters,    setFilters]    = useState({ status: '', priority: '' });
  const [page,       setPage]       = useState(1);
  const [saving,     setSaving]     = useState(false);

  const [form, setForm] = useState({ product: '', quantity: '', assignedTo: '', supervisor: '', priority: 'medium', dueDate: '', notes: '' });
  const [progForm, setProgForm] = useState({ progress: 0, note: '' });

  const isSuperPlus = ['admin', 'supervisor'].includes(user.role);
  const isAdmin     = user.role === 'admin';

  useEffect(() => {
    dispatch(fetchOrders({ ...filters, page }));
    if (isSuperPlus) {
      dispatch(fetchProducts({ limit: 100 }));
      dispatch(fetchUsers());
    }
  }, [filters, page]);

  const handleCreate = async () => {
    if (!form.product || !form.quantity || !form.dueDate) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    const result = await dispatch(createOrder(form));
    setSaving(false);
    if (!result.error) { toast.success('Production order created'); setShowCreate(false); setForm({ product: '', quantity: '', assignedTo: '', supervisor: '', priority: 'medium', dueDate: '', notes: '' }); }
    else toast.error(result.payload || 'Failed to create order');
  };

  const handleProgress = async () => {
    setSaving(true);
    const result = await dispatch(updateProgress({ id: progOrder._id, ...progForm }));
    setSaving(false);
    if (!result.error) { toast.success('Progress updated'); setProgOrder(null); setProgForm({ progress: 0, note: '' }); }
    else toast.error(result.payload || 'Failed to update');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteOrder(deleting._id));
    if (!result.error) { toast.success('Order deleted'); setDeleting(null); }
    else toast.error(result.payload || 'Failed to delete');
  };

  const workers     = users.filter(u => u.role === 'user');
  const supervisors = users.filter(u => ['admin', 'supervisor'].includes(u.role));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Production Management</div>
          <div className="page-subtitle">Track and manage all production orders</div>
        </div>
        {isSuperPlus && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={15} />New Order</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Total Orders',  value: total, icon: 'clipboard', iconColor: 'var(--primary)', iconBg: 'var(--primary-light)' },
          { label: 'In Progress',   value: orders.filter(o => o.status === 'in_progress').length,  icon: 'activity',  iconColor: '#7C3AED', iconBg: 'var(--purple-light)' },
          { label: 'Completed',     value: orders.filter(o => o.status === 'completed').length,     icon: 'check',     iconColor: 'var(--success)', iconBg: 'var(--success-light)' },
          { label: 'Pending',       value: orders.filter(o => o.status === 'pending').length,       icon: 'clock',     iconColor: 'var(--warning)', iconBg: 'var(--warning-light)' },
        ].map((k, i) => <KpiCard key={i} {...k} loading={loading} />)}
      </div>

      {/* Table */}
      <div className="card">
        <TableToolbar title={`All Orders (${total})`}>
          <select className="input" style={{ height: 34, width: 140 }} value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option><option value="in_progress">In Progress</option>
            <option value="completed">Completed</option><option value="on_hold">On Hold</option>
          </select>
          <select className="input" style={{ height: 34, width: 130 }} value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
            <option value="">All Priority</option>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({ status: '', priority: '' }); setPage(1); }}><Icon name="refresh" size={13} />Reset</button>
        </TableToolbar>

        <div className="table-wrap">
          {loading ? <SkeletonTable rows={5} cols={8} /> : orders.length === 0 ? (
            <EmptyState icon="clipboard" title="No production orders" description="Create your first production order to get started."
              action={isSuperPlus && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={14} />New Order</button>} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th><th>Product</th><th>Qty</th><th>Assigned To</th>
                  <th>Priority</th><th>Progress</th><th>Due Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><span className="mono">{o.orderId}</span></td>
                    <td><span style={{ fontWeight: 500 }}>{o.product?.name || '—'}</span></td>
                    <td>{o.quantity}</td>
                    <td>{o.assignedTo?.name || '—'}</td>
                    <td><Badge status={o.priority} /></td>
                    <td style={{ minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProgressBar value={o.progress} />
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{o.progress}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{fmt.date(o.dueDate)}</td>
                    <td><Badge status={o.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setSelected(o)}><Icon name="eye" size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Update Progress" onClick={() => { setProgOrder(o); setProgForm({ progress: o.progress, note: '' }); }}><Icon name="chart" size={13} /></button>
                        {isAdmin && <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(o)}><Icon name="trash" size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total / 20)} onPage={setPage} />
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Production Order" subtitle="Fill in details for the new order"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <span className="spinner" /> : 'Create Order'}</button></>}>
        <div className="input-group">
          <label className="input-label">Product *</label>
          <select className="input" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">Quantity *</label>
            <input className="input" type="number" min="1" placeholder="100" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Assign To (Worker)</label>
          <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Select worker…</option>
            {workers.map(u => <option key={u._id} value={u._id}>{u.name} — {u.department}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Supervisor</label>
          <select className="input" value={form.supervisor} onChange={e => setForm({ ...form, supervisor: e.target.value })}>
            <option value="">Select supervisor…</option>
            {supervisors.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Due Date *</label>
          <input className="input" type="date" value={form.dueDate} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Notes</label>
          <textarea className="input" rows={2} placeholder="Any special instructions…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.orderId || ''} subtitle="Production order details" size="lg"
        footer={<button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>}>
        {selected && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                ['Product',     selected.product?.name],
                ['Quantity',    `${selected.quantity} units`],
                ['Assigned To', selected.assignedTo?.name || '—'],
                ['Supervisor',  selected.supervisor?.name || '—'],
                ['Due Date',    fmt.date(selected.dueDate)],
                ['Created',     fmt.date(selected.createdAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <Badge status={selected.status} /><Badge status={selected.priority} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProgressBar value={selected.progress} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{selected.progress}%</span>
              </div>
            </div>

            {selected.notes && (
              <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                {selected.notes}
              </div>
            )}

            {selected.timeline?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>Timeline</div>
                <div className="timeline">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot done"><Icon name="check" size={7} style={{ color: 'white' }} /></div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.stage}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmt.timeAgo(t.createdAt)} · {t.completedBy?.name || 'System'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Progress Modal */}
      <Modal isOpen={!!progOrder} onClose={() => setProgOrder(null)} title="Update Progress" subtitle={progOrder?.orderId}
        footer={<><button className="btn btn-secondary" onClick={() => setProgOrder(null)}>Cancel</button><button className="btn btn-primary" onClick={handleProgress} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button></>}>
        {progOrder && (
          <>
            <div className="input-group">
              <label className="input-label">Progress: {progForm.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={progForm.progress} onChange={e => setProgForm({ ...progForm, progress: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
              <div style={{ marginTop: 8 }}>
                <ProgressBar value={progForm.progress} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Note (optional)</label>
              <textarea className="input" rows={2} placeholder="e.g. Machine setup completed…" value={progForm.note} onChange={e => setProgForm({ ...progForm, note: e.target.value })} />
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Order" message={`Delete order ${deleting?.orderId}? All associated tasks will also be removed.`} />
    </div>
  );
}
