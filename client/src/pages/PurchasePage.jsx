import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { suppliersAPI, purchaseOrdersAPI, productsAPI } from '../services/api';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, fmt } from '../components/ui';

export default function PurchasePage() {
  const [tab, setTab] = useState('orders');

  return (
    <div>
      <div className="page-header" style={{display:'block'}}>
        <div className="page-title">Purchase Orders & Suppliers</div>
        <div className="page-subtitle">Manage vendor relationships and incoming stock</div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid var(--border)'}}>
        {[{id:'orders',label:'Purchase Orders',icon:'clipboard'},{id:'suppliers',label:'Suppliers',icon:'users'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="btn btn-ghost"
            style={{borderBottom:tab===t.id?'2px solid var(--primary)':'2px solid transparent',borderRadius:0,color:tab===t.id?'var(--primary)':'var(--text-secondary)',paddingBottom:12,fontWeight:tab===t.id?600:400}}>
            <Icon name={t.icon} size={15}/>{t.label}
          </button>
        ))}
      </div>
      {tab==='orders'    && <PurchaseOrdersTab/>}
      {tab==='suppliers' && <SuppliersTab/>}
    </div>
  );
}

// ── Purchase Orders Tab ───────────────────────────────────────────────────────
function PurchaseOrdersTab() {
  const [orders,   setOrders]   = useState([]);
  const [suppliers,setSuppliers]= useState([]);
  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [statusF,  setStatusF]  = useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [viewPO,   setViewPO]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const emptyForm = { supplier:'', items:[{product:'',quantity:1,unitPrice:0}], gstRate:18, expectedDate:'', notes:'' };
  const [form, setForm] = useState(emptyForm);

  const subtotal = form.items.reduce((s,i)=>s+(i.quantity*i.unitPrice),0);
  const gst      = subtotal*(form.gstRate/100);
  const total_   = subtotal+gst;

  useEffect(()=>{ load(); },[statusF,page]);
  useEffect(()=>{ loadSuppliers(); loadProducts(); },[]);

  const load = async () => {
    setLoading(true);
    try {
      const {data} = await purchaseOrdersAPI.getAll({status:statusF,page});
      setOrders(data.data); setTotal(data.total);
    } finally { setLoading(false); }
  };
  const loadSuppliers = async () => { try { const {data}=await suppliersAPI.getAll({limit:100}); setSuppliers(data.data); } catch{} };
  const loadProducts  = async () => { try { const {data}=await productsAPI.getAll({limit:100});   setProducts(data.data);  } catch{} };

  const addItem    = ()  => setForm({...form,items:[...form.items,{product:'',quantity:1,unitPrice:0}]});
  const removeItem = (i) => setForm({...form,items:form.items.filter((_,idx)=>idx!==i)});
  const updateItem = (idx,field,val) => {
    const items=[...form.items]; items[idx]={...items[idx],[field]:val};
    if(field==='product'){ const p=products.find(x=>x._id===val); if(p) items[idx].unitPrice=p.price; }
    setForm({...form,items});
  };

  const handleCreate = async () => {
    if(!form.supplier||form.items.some(i=>!i.product)){toast.error('Fill all required fields');return;}
    setSaving(true);
    try {
      await purchaseOrdersAPI.create(form);
      toast.success('Purchase order created'); setShowCreate(false); setForm(emptyForm); load();
    } catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const handleStatus = async (po,status) => {
    try { await purchaseOrdersAPI.updateStatus(po._id,{status}); toast.success(`PO marked as ${status}`); load(); }
    catch(e){toast.error(e.response?.data?.message||'Failed');}
  };

  const pending   = orders.filter(o=>o.status==='sent').length;
  const received  = orders.filter(o=>o.status==='received').length;
  const totalSpend= orders.reduce((s,o)=>s+o.total,0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowCreate(true)}}><Icon name="plus" size={15}/>New Purchase Order</button>
      </div>
      <div className="grid-4 mb-6">
        <KpiCard label="Total Orders" value={total}    icon="clipboard" iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading}/>
        <KpiCard label="Pending"      value={pending}  icon="clock"     iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading}/>
        <KpiCard label="Received"     value={received} icon="check"     iconColor="var(--success)" iconBg="var(--success-light)" loading={loading}/>
        <KpiCard label="Total Spend"  value={fmt.currency(totalSpend)} icon="dollar" iconColor="var(--purple)" iconBg="var(--purple-light)" loading={loading}/>
      </div>

      <div className="card">
        <TableToolbar title={`Purchase Orders (${total})`}>
          <select className="input" style={{height:34,width:150}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1)}}>
            <option value="">All Status</option>
            <option value="draft">Draft</option><option value="sent">Sent</option>
            <option value="partial">Partial</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
          </select>
        </TableToolbar>
        <div className="table-wrap">
          {loading ? <SkeletonTable rows={5} cols={7}/> : orders.length===0 ? (
            <EmptyState icon="package" title="No purchase orders" description="Create your first PO to start ordering from suppliers."
              action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icon name="plus" size={14}/>New PO</button>}/>
          ) : (
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Items</th><th style={{textAlign:'right'}}>Subtotal</th><th style={{textAlign:'right'}}>GST</th><th style={{textAlign:'right'}}>Total</th><th>Expected</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(po=>(
                  <tr key={po._id}>
                    <td><span className="mono">{po.poNumber}</span></td>
                    <td style={{fontWeight:500}}>{po.supplier?.name||'—'}</td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{po.items.length} items</td>
                    <td style={{textAlign:'right'}}>{fmt.currency(po.subtotal)}</td>
                    <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{fmt.currency(po.gstAmount)}</td>
                    <td style={{textAlign:'right',fontWeight:600}}>{fmt.currency(po.total)}</td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{po.expectedDate?fmt.date(po.expectedDate):'—'}</td>
                    <td><Badge status={po.status}/></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setViewPO(po)}><Icon name="eye" size={13}/></button>
                        {po.status==='sent'&&<button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--success)'}} title="Mark Received" onClick={()=>handleStatus(po,'received')}><Icon name="check" size={13}/></button>}
                        {['draft','cancelled'].includes(po.status)&&<button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleting(po)}><Icon name="trash" size={13}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total/20)} onPage={setPage}/>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Create Purchase Order" size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?<span className="spinner"/>:'Create PO'}</button></>}>
        <div className="input-group"><label className="input-label">Supplier *</label>
          <select className="input" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}>
            <option value="">Select supplier…</option>
            {suppliers.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Expected Date</label><input className="input" type="date" value={form.expectedDate} onChange={e=>setForm({...form,expectedDate:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">GST Rate (%)</label>
            <select className="input" value={form.gstRate} onChange={e=>setForm({...form,gstRate:Number(e.target.value)})}>
              {[5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
            </select></div>
        </div>
        <hr className="divider"/>
        <div style={{fontWeight:600,fontSize:12,color:'var(--text-secondary)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Line Items</div>
        {form.items.map((item,idx)=>(
          <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 70px 100px 36px',gap:8,marginBottom:8,alignItems:'end'}}>
            <div>{idx===0&&<label className="input-label">Product</label>}
              <select className="input" value={item.product} onChange={e=>updateItem(idx,'product',e.target.value)}>
                <option value="">Select…</option>
                {products.map(p=><option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select></div>
            <div>{idx===0&&<label className="input-label">Qty</label>}
              <input className="input" type="number" min="1" value={item.quantity} onChange={e=>updateItem(idx,'quantity',Number(e.target.value))}/></div>
            <div>{idx===0&&<label className="input-label">Amount</label>}
              <div className="input" style={{background:'var(--surface2)',display:'flex',alignItems:'center',fontSize:13,color:'var(--text-secondary)'}}>{fmt.currency(item.quantity*item.unitPrice)}</div></div>
            <div>{idx===0&&<label className="input-label">&nbsp;</label>}
              <button className="btn btn-ghost btn-icon" onClick={()=>removeItem(idx)} disabled={form.items.length===1}><Icon name="x" size={14}/></button></div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addItem} style={{marginBottom:16}}><Icon name="plus" size={13}/>Add Item</button>
        <div style={{background:'var(--surface2)',borderRadius:'var(--radius-md)',padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span style={{color:'var(--text-secondary)'}}>Subtotal</span><span>{fmt.currency(subtotal)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span style={{color:'var(--text-secondary)'}}>GST ({form.gstRate}%)</span><span>{fmt.currency(gst)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontWeight:700,fontSize:15,borderTop:'1px solid var(--border)'}}><span>Total</span><span style={{color:'var(--primary)'}}>{fmt.currency(total_)}</span></div>
        </div>
      </Modal>

      {/* View PO Modal */}
      <Modal isOpen={!!viewPO} onClose={()=>setViewPO(null)} title={viewPO?.poNumber||''} subtitle={`Supplier: ${viewPO?.supplier?.name||''}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setViewPO(null)}>Close</button>
          {viewPO?.status==='draft'&&<button className="btn btn-primary" onClick={()=>{handleStatus(viewPO,'sent');setViewPO(null)}}>Send to Supplier</button>}
          {viewPO?.status==='sent'&&<button className="btn btn-primary" style={{background:'var(--success)'}} onClick={()=>{handleStatus(viewPO,'received');setViewPO(null)}}>Mark Received</button>}
        </>}>
        {viewPO&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
              {[['Supplier',viewPO.supplier?.name],['Phone',viewPO.supplier?.phone||'—'],['GST No.',viewPO.supplier?.gstNumber||'—'],
                ['Expected',fmt.date(viewPO.expectedDate)],['Created',fmt.date(viewPO.createdAt)],['Status','']].map(([k,v],i)=>(
                <div key={i}><div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k}</div>
                  {k==='Status'?<Badge status={viewPO.status}/>:<div style={{fontSize:13.5,fontWeight:500}}>{v}</div>}</div>
              ))}
            </div>
            <table style={{width:'100%',fontSize:13,marginBottom:16}}>
              <thead><tr style={{background:'var(--surface2)'}}>
                <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>Product</th>
                <th style={{padding:'8px 10px',textAlign:'center',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>Qty</th>
                <th style={{padding:'8px 10px',textAlign:'right',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>Unit Price</th>
                <th style={{padding:'8px 10px',textAlign:'right',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>Total</th>
              </tr></thead>
              <tbody>
                {viewPO.items.map((item,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid var(--border-light)'}}>
                    <td style={{padding:'10px'}}>{item.name}</td>
                    <td style={{padding:'10px',textAlign:'center'}}>{item.quantity}</td>
                    <td style={{padding:'10px',textAlign:'right'}}>{fmt.currency(item.unitPrice)}</td>
                    <td style={{padding:'10px',textAlign:'right',fontWeight:600}}>{fmt.currency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginLeft:'auto',width:240}}>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span style={{color:'var(--text-secondary)'}}>Subtotal</span><span>{fmt.currency(viewPO.subtotal)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span style={{color:'var(--text-secondary)'}}>GST ({viewPO.gstRate}%)</span><span>{fmt.currency(viewPO.gstAmount)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontWeight:700,fontSize:15,borderTop:'1px solid var(--border)'}}><span>Total</span><span style={{color:'var(--primary)'}}>{fmt.currency(viewPO.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={()=>setDeleting(null)} onConfirm={async()=>{await purchaseOrdersAPI.remove(deleting._id);setDeleting(null);toast.success('PO deleted');load();}} title="Delete PO" message={`Delete ${deleting?.poNumber}?`}/>
    </div>
  );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────
function SuppliersTab() {
  const [suppliers,setSuppliers]=useState([]);
  const [total,    setTotal]   =useState(0);
  const [loading,  setLoading] =useState(true);
  const [page,     setPage]    =useState(1);
  const [search,   setSearch]  =useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [editItem, setEditItem]=useState(null);
  const [deleting, setDeleting]=useState(null);
  const [saving,   setSaving]  =useState(false);

  const emptyForm={name:'',contactPerson:'',email:'',phone:'',address:'',city:'',state:'',gstNumber:'',panNumber:'',paymentTerms:30,notes:''};
  const [form,setForm]=useState(emptyForm);

  useEffect(()=>{
    const t=setTimeout(()=>load(),search?400:0);
    return()=>clearTimeout(t);
  },[search,page]);

  const load=async()=>{
    setLoading(true);
    try{const{data}=await suppliersAPI.getAll({search,page});setSuppliers(data.data);setTotal(data.total);}
    finally{setLoading(false);}
  };
  const openEdit=(s)=>{setForm({name:s.name,contactPerson:s.contactPerson,email:s.email,phone:s.phone,address:s.address,city:s.city,state:s.state,gstNumber:s.gstNumber,panNumber:s.panNumber,paymentTerms:s.paymentTerms,notes:s.notes});setEditItem(s);};
  const handleSave=async()=>{
    if(!form.name){toast.error('Supplier name required');return;}
    setSaving(true);
    try{
      editItem?await suppliersAPI.update(editItem._id,form):await suppliersAPI.create(form);
      toast.success(editItem?'Supplier updated':'Supplier added');setShowCreate(false);setEditItem(null);setForm(emptyForm);load();
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const ratingStars=(r)=>['★','★','★','★','★'].map((s,i)=><span key={i} style={{color:i<r?'var(--warning)':'var(--border)',fontSize:13}}>{s}</span>);

  return(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setEditItem(null);setShowCreate(true)}}><Icon name="plus" size={15}/>Add Supplier</button>
      </div>
      <div className="card">
        <TableToolbar title={`Suppliers (${total})`}>
          <input className="input" style={{height:34,width:220}} placeholder="Search name, GST…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
        </TableToolbar>
        <div className="table-wrap">
          {loading?<SkeletonTable rows={5} cols={6}/>:suppliers.length===0?(
            <EmptyState icon="users" title="No suppliers yet" description="Add your first supplier to start managing purchases."
              action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icon name="plus" size={14}/>Add Supplier</button>}/>
          ):(
            <table>
              <thead><tr><th>Supplier</th><th>Contact</th><th>GST No.</th><th>City</th><th>Rating</th><th>Terms</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {suppliers.map(s=>(
                  <tr key={s._id}>
                    <td><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:11.5,color:'var(--text-secondary)'}}>{s.email}</div></td>
                    <td><div style={{fontSize:13}}>{s.contactPerson||'—'}</div><div style={{fontSize:11.5,color:'var(--text-secondary)'}}>{s.phone||''}</div></td>
                    <td><span className="mono">{s.gstNumber||'—'}</span></td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{s.city||'—'}</td>
                    <td>{ratingStars(s.rating)}</td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{s.paymentTerms} days</td>
                    <td><Badge status={s.status}/></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(s)}><Icon name="edit" size={13}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleting(s)}><Icon name="trash" size={13}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total/20)} onPage={setPage}/>
      </div>

      <Modal isOpen={showCreate||!!editItem} onClose={()=>{setShowCreate(false);setEditItem(null);}} title={editItem?'Edit Supplier':'Add Supplier'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>{setShowCreate(false);setEditItem(null);}}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?<span className="spinner"/>:editItem?'Save':'Add Supplier'}</button></>}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Supplier Name *</label><input className="input" placeholder="ABC Steels Pvt Ltd" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Contact Person</label><input className="input" placeholder="Ramesh Kumar" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" placeholder="contact@abc.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Phone</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">GST Number</label><input className="input" placeholder="27AADCB2230M1ZT" value={form.gstNumber} onChange={e=>setForm({...form,gstNumber:e.target.value.toUpperCase()})}/></div>
          <div className="input-group"><label className="input-label">PAN Number</label><input className="input" placeholder="AADCB2230M" value={form.panNumber} onChange={e=>setForm({...form,panNumber:e.target.value.toUpperCase()})}/></div>
          <div className="input-group"><label className="input-label">City</label><input className="input" placeholder="Mumbai" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Payment Terms (days)</label><input className="input" type="number" min="0" value={form.paymentTerms} onChange={e=>setForm({...form,paymentTerms:Number(e.target.value)})}/></div>
        </div>
        <div className="input-group"><label className="input-label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        <div className="input-group"><label className="input-label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={()=>setDeleting(null)} onConfirm={async()=>{await suppliersAPI.remove(deleting._id);setDeleting(null);toast.success('Supplier deleted');load();}} title="Delete Supplier" message={`Delete "${deleting?.name}"?`}/>
    </div>
  );
}
