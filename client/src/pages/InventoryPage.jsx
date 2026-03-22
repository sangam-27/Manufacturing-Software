import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../store/slices/productsSlice';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, fmt } from '../components/ui';

const CATEGORIES = ['Brackets','Shafts','Gears','Bearings','Valves','Belts','Couplings','Mounts','Other'];

export default function InventoryPage() {
  const dispatch = useDispatch();
  const { items: products, total, loading } = useSelector(s => s.products);

  const [showCreate,  setShowCreate]  = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [stockModal,  setStockModal]  = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [page,        setPage]        = useState(1);

  const emptyForm = { name: '', sku: '', category: '', description: '', stock: '', minStock: '', price: '', unit: 'pcs' };
  const [form, setForm] = useState(emptyForm);
  const [stockForm, setStockForm] = useState({ type: 'in', quantity: '', reason: '' });

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchProducts({ search, category: catFilter, status: statusFilter, page }));
    }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, catFilter, statusFilter, page]);

  const openEdit = (p) => { setForm({ name: p.name, sku: p.sku, category: p.category, description: p.description || '', stock: p.stock, minStock: p.minStock, price: p.price, unit: p.unit }); setEditItem(p); };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.category || !form.price) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    const result = editItem
      ? await dispatch(updateProduct({ id: editItem._id, ...form }))
      : await dispatch(createProduct(form));
    setSaving(false);
    if (!result.error) { toast.success(editItem ? 'Product updated' : 'Product created'); setShowCreate(false); setEditItem(null); setForm(emptyForm); }
    else toast.error(result.payload || 'Failed');
  };

  const handleStock = async () => {
    if (!stockForm.quantity) { toast.error('Enter quantity'); return; }
    setSaving(true);
    const result = await dispatch(adjustStock({ id: stockModal._id, ...stockForm, quantity: Number(stockForm.quantity) }));
    setSaving(false);
    if (!result.error) { toast.success('Stock adjusted'); setStockModal(null); setStockForm({ type: 'in', quantity: '', reason: '' }); }
    else toast.error(result.payload || 'Failed');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteProduct(deleting._id));
    if (!result.error) { toast.success('Product deleted'); setDeleting(null); }
    else toast.error(result.payload || 'Failed');
  };

  const lowStock  = products.filter(p => p.status === 'low_stock').length;
  const outStock  = products.filter(p => p.status === 'out_of_stock').length;
  const totalVal  = products.reduce((s, p) => s + p.stock * p.price, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Inventory Management</div>
          <div className="page-subtitle">Monitor stock levels and manage products</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditItem(null); setShowCreate(true); }}><Icon name="plus" size={15} />Add Product</button>
      </div>

      <div className="grid-4 mb-6">
        <KpiCard label="Total Products"  value={total} icon="package" iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading} />
        <KpiCard label="Low Stock"       value={lowStock} icon="alert" iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading} />
        <KpiCard label="Out of Stock"    value={outStock} icon="x"     iconColor="var(--danger)"  iconBg="var(--danger-light)"  loading={loading} />
        <KpiCard label="Total Value"     value={fmt.currency(totalVal)} icon="dollar" iconColor="var(--success)" iconBg="var(--success-light)" loading={loading} />
      </div>

      {(lowStock > 0 || outStock > 0) && (
        <div className="alert alert-warning mb-4">
          <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13 }}>
            <strong>{lowStock} product{lowStock !== 1 ? 's' : ''}</strong> running low
            {outStock > 0 && <> and <strong>{outStock}</strong> completely out of stock</>}.
            Review and reorder immediately.
          </span>
        </div>
      )}

      <div className="card">
        <TableToolbar title={`Products (${total})`}>
          <input className="input" style={{ height: 34, width: 200 }} placeholder="Search name, SKU…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="input" style={{ height: 34, width: 140 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" style={{ height: 34, width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option>
          </select>
        </TableToolbar>

        <div className="table-wrap">
          {loading ? <SkeletonTable rows={6} cols={7} /> : products.length === 0 ? (
            <EmptyState icon="package" title="No products found" description="Add your first product to start tracking inventory."
              action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={14} />Add Product</button>} />
          ) : (
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock Level</th><th>Min Stock</th><th>Price/Unit</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const pct = Math.min(100, (p.stock / Math.max(p.minStock * 2, 1)) * 100);
                  const fillColor = p.stock === 0 ? 'var(--danger)' : p.stock < p.minStock ? 'var(--warning)' : 'var(--success)';
                  return (
                    <tr key={p._id}>
                      <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                      <td><span className="mono">{p.sku}</span></td>
                      <td><span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.category}</span></td>
                      <td style={{ minWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="stock-bar"><div className="stock-fill" style={{ width: pct + '%', background: fillColor }} /></div>
                          <span style={{ fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right', color: p.stock === 0 ? 'var(--danger)' : p.stock < p.minStock ? 'var(--warning)' : 'var(--text-primary)' }}>{p.stock}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.minStock} {p.unit}</td>
                      <td style={{ fontWeight: 600 }}>{fmt.currency(p.price)}</td>
                      <td><Badge status={p.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Adjust Stock" onClick={() => { setStockModal(p); setStockForm({ type: 'in', quantity: '', reason: '' }); }}><Icon name="refresh" size={13} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(p)}><Icon name="edit" size={13} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(p)}><Icon name="trash" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total / 20)} onPage={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreate || !!editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} title={editItem ? 'Edit Product' : 'Add Product'} subtitle={editItem ? `Editing ${editItem.name}` : 'Add a new item to inventory'}
        footer={<><button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : editItem ? 'Save Changes' : 'Add Product'}</button></>}>
        <div className="input-group"><label className="input-label">Product Name *</label><input className="input" placeholder="e.g. Steel Bracket A12" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">SKU *</label><input className="input" placeholder="e.g. SBA-012" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} /></div>
          <div className="input-group"><label className="input-label">Category *</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select…</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">Current Stock</label><input className="input" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Min Stock</label><input className="input" type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Unit</label>
            <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="pcs">Pieces</option><option value="kits">Kits</option><option value="sets">Sets</option><option value="kg">Kg</option><option value="m">Metres</option>
            </select></div>
        </div>
        <div className="input-group"><label className="input-label">Price (₹) *</label><input className="input" type="number" min="0" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Description</label><textarea className="input" rows={2} placeholder="Optional description…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={!!stockModal} onClose={() => setStockModal(null)} title="Adjust Stock" subtitle={stockModal?.name} size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleStock} disabled={saving}>{saving ? <span className="spinner" /> : 'Apply'}</button></>}>
        {stockModal && (
          <>
            <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13 }}>
              Current stock: <strong>{stockModal.stock} {stockModal.unit}</strong>
            </div>
            <div className="input-group"><label className="input-label">Adjustment Type</label>
              <select className="input" value={stockForm.type} onChange={e => setStockForm({ ...stockForm, type: e.target.value })}>
                <option value="in">Stock In (Add)</option><option value="out">Stock Out (Remove)</option><option value="adjustment">Set Absolute Value</option>
              </select></div>
            <div className="input-group"><label className="input-label">Quantity *</label><input className="input" type="number" min="1" placeholder="0" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Reason</label><input className="input" placeholder="e.g. Received from supplier" value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} /></div>
          </>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete Product" message={`Permanently delete "${deleting?.name}"? This cannot be undone.`} />
    </div>
  );
}
