import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from '../store/slices/billingSlice';
import { fetchProducts } from '../store/slices/productsSlice';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, fmt } from '../components/ui';

export default function BillingPage() {
  const dispatch = useDispatch();
  const { items: invoices, total, loading } = useSelector(s => s.billing);
  const { items: products } = useSelector(s => s.products);

  const [showCreate, setShowCreate] = useState(false);
  const [viewInv,    setViewInv]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const emptyForm = { client: '', clientGST: '', clientAddress: '', gstRate: 18, dueDate: '', notes: '', status: 'pending', items: [{ product: '', quantity: 1, unitPrice: 0 }] };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { dispatch(fetchInvoices({ status: statusFilter, page })); }, [statusFilter, page]);
  useEffect(() => { dispatch(fetchProducts({ limit: 100 })); }, []);

  const subtotal = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const gst      = subtotal * (form.gstRate / 100);
  const total_   = subtotal + gst;

  const addItem    = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    if (field === 'product') {
      const p = products.find(x => x._id === val);
      if (p) items[idx].unitPrice = p.price;
    }
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    if (!form.client) { toast.error('Client name is required'); return; }
    if (form.items.some(i => !i.product)) { toast.error('Select a product for all line items'); return; }
    setSaving(true);
    const result = await dispatch(createInvoice(form));
    setSaving(false);
    if (!result.error) { toast.success('Invoice created'); setShowCreate(false); setForm(emptyForm); }
    else toast.error(result.payload || 'Failed to create invoice');
  };

  const handleStatusChange = async (inv, status) => {
    const result = await dispatch(updateInvoiceStatus({ id: inv._id, status }));
    if (!result.error) toast.success(`Invoice marked as ${status}`);
    else toast.error(result.payload || 'Failed');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteInvoice(deleting._id));
    if (!result.error) { toast.success('Invoice deleted'); setDeleting(null); }
    else toast.error(result.payload || 'Cannot delete this invoice');
  };

  const paid      = invoices.filter(i => i.status === 'paid').length;
  const pending   = invoices.filter(i => i.status === 'pending').length;
  const overdue   = invoices.filter(i => i.status === 'overdue').length;
  const revenue   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Billing & Sales</div>
          <div className="page-subtitle">Manage invoices and track revenue</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowCreate(true); }}><Icon name="plus" size={15} />New Invoice</button>
      </div>

      <div className="grid-4 mb-6">
        <KpiCard label="Total Revenue"   value={fmt.currency(revenue)} icon="dollar"   iconColor="var(--success)" iconBg="var(--success-light)" loading={loading} />
        <KpiCard label="Paid Invoices"   value={paid}    icon="check"    iconColor="var(--success)" iconBg="var(--success-light)" loading={loading} />
        <KpiCard label="Pending"         value={pending} icon="clock"    iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading} />
        <KpiCard label="Overdue"         value={overdue} icon="alert"    iconColor="var(--danger)"  iconBg="var(--danger-light)"  loading={loading} />
      </div>

      <div className="card">
        <TableToolbar title={`Invoices (${total})`}>
          <select className="input" style={{ height: 34, width: 150 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option><option value="pending">Pending</option>
            <option value="overdue">Overdue</option><option value="draft">Draft</option>
          </select>
        </TableToolbar>

        <div className="table-wrap">
          {loading ? <SkeletonTable rows={5} cols={7} /> : invoices.length === 0 ? (
            <EmptyState icon="billing" title="No invoices yet" description="Create your first invoice to start tracking sales."
              action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={14} />New Invoice</button>} />
          ) : (
            <table>
              <thead><tr><th>Invoice</th><th>Client</th><th>Items</th><th>Amount</th><th>GST</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td><span className="mono">{inv.invoiceNumber}</span></td>
                    <td style={{ fontWeight: 500 }}>{inv.client}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{inv.items.length} item{inv.items.length !== 1 ? 's' : ''}</td>
                    <td>{fmt.currency(inv.subtotal)}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{fmt.currency(inv.gstAmount)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt.currency(inv.total)}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{fmt.date(inv.createdAt)}</td>
                    <td><Badge status={inv.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Preview" onClick={() => setViewInv(inv)}><Icon name="eye" size={13} /></button>
                        {inv.status === 'pending' && <button className="btn btn-ghost btn-icon btn-sm" title="Mark Paid" style={{ color: 'var(--success)' }} onClick={() => handleStatusChange(inv, 'paid')}><Icon name="check" size={13} /></button>}
                        {['draft', 'cancelled'].includes(inv.status) && <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(inv)}><Icon name="trash" size={13} /></button>}
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

      {/* Create Invoice Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice" size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <span className="spinner" /> : 'Create Invoice'}</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">Client Name *</label><input className="input" placeholder="e.g. Tata Autocomp" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">GST Number</label><input className="input" placeholder="27AADCB2230M1ZT" value={form.clientGST} onChange={e => setForm({ ...form, clientGST: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">GST Rate (%)</label>
            <select className="input" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: Number(e.target.value) })}>
              <option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
            </select>
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>Line Items</div>
        {form.items.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 36px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
            <div>
              {idx === 0 && <label className="input-label">Product</label>}
              <select className="input" value={item.product} onChange={e => updateItem(idx, 'product', e.target.value)}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              {idx === 0 && <label className="input-label">Qty</label>}
              <input className="input" type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
            </div>
            <div>
              {idx === 0 && <label className="input-label">Amount</label>}
              <div className="input" style={{ background: 'var(--surface2)', display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>{fmt.currency(item.quantity * item.unitPrice)}</div>
            </div>
            <div>
              {idx === 0 && <label className="input-label">&nbsp;</label>}
              <button className="btn btn-ghost btn-icon" onClick={() => removeItem(idx)} disabled={form.items.length === 1}><Icon name="x" size={14} /></button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 16 }}><Icon name="plus" size={13} />Add Line Item</button>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <div className="invoice-line"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{fmt.currency(subtotal)}</span></div>
          <div className="invoice-line"><span style={{ color: 'var(--text-secondary)' }}>GST ({form.gstRate}%)</span><span>{fmt.currency(gst)}</span></div>
          <div className="invoice-total"><span style={{ fontWeight: 700 }}>Total</span><span style={{ color: 'var(--primary)', fontWeight: 800 }}>{fmt.currency(total_)}</span></div>
        </div>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal isOpen={!!viewInv} onClose={() => setViewInv(null)} title="Invoice Preview" size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setViewInv(null)}>Close</button><button className="btn btn-primary"><Icon name="download" size={14} />Download PDF</button></>}>
        {viewInv && (
          <div className="invoice-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)', marginBottom: 4 }}>ManufactureOS</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Plot 45, Industrial Area, Pune 411019</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>GST: 27AADCM2230M1ZT</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{viewInv.invoiceNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Date: {fmt.date(viewInv.createdAt)}</div>
                <Badge status={viewInv.status} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{viewInv.client}</div>
              {viewInv.clientGST && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>GST: {viewInv.clientGST}</div>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Product', 'SKU', 'Qty', 'Unit Price', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Product' || h === 'SKU' ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewInv.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>{item.name || item.product?.name}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-secondary)' }}>{item.sku}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>{fmt.currency(item.unitPrice)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', textAlign: 'right', fontWeight: 600 }}>{fmt.currency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginLeft: 'auto', width: 260 }}>
              <div className="invoice-line"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{fmt.currency(viewInv.subtotal)}</span></div>
              <div className="invoice-line"><span style={{ color: 'var(--text-secondary)' }}>GST ({viewInv.gstRate}%)</span><span>{fmt.currency(viewInv.gstAmount)}</span></div>
              <div className="invoice-total"><span>Total</span><span style={{ color: 'var(--primary)' }}>{fmt.currency(viewInv.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete invoice ${deleting?.invoiceNumber}?`} />
    </div>
  );
}
