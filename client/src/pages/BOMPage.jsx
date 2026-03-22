import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { bomAPI, productsAPI } from '../services/api';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, fmt } from '../components/ui';

export default function BOMPage() {
  const [boms,      setBoms]     = useState([]);
  const [products,  setProducts] = useState([]);
  const [total,     setTotal]    = useState(0);
  const [loading,   setLoading]  = useState(true);
  const [page,      setPage]     = useState(1);
  const [showCreate,setShowCreate]=useState(false);
  const [viewBOM,   setViewBOM]  = useState(null);
  const [deleting,  setDeleting] = useState(null);
  const [saving,    setSaving]   = useState(false);
  const [checking,  setChecking] = useState(null);
  const [checkQty,  setCheckQty] = useState(1);
  const [checkResult,setCheckResult]=useState(null);

  const emptyForm = {
    product:'', version:'1.0', laborHours:0, laborCost:0, overheadPct:10, notes:'',
    components:[{material:'',quantity:1,unit:'pcs',scrapFactor:0,notes:''}],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{load();},[page]);
  useEffect(()=>{loadProducts();},[]);

  const load=async()=>{
    setLoading(true);
    try{const{data}=await bomAPI.getAll({page});setBoms(data.data);setTotal(data.total);}
    catch{toast.error('Failed to load BOMs');}
    finally{setLoading(false);}
  };
  const loadProducts=async()=>{
    try{const{data}=await productsAPI.getAll({limit:200});setProducts(data.data);}catch{}
  };

  const addComp    = ()  => setForm({...form,components:[...form.components,{material:'',quantity:1,unit:'pcs',scrapFactor:0,notes:''}]});
  const removeComp = (i) => setForm({...form,components:form.components.filter((_,idx)=>idx!==i)});
  const updateComp = (idx,field,val)=>{
    const c=[...form.components]; c[idx]={...c[idx],[field]:val};
    if(field==='material'){const p=products.find(x=>x._id===val);if(p)c[idx].unit=p.unit||'pcs';}
    setForm({...form,components:c});
  };

  const handleCreate=async()=>{
    if(!form.product||form.components.some(c=>!c.material)){toast.error('Select product and all materials');return;}
    setSaving(true);
    try{
      await bomAPI.create(form);
      toast.success('BOM created');setShowCreate(false);setForm(emptyForm);load();
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const handleCheckAvailability=async()=>{
    if(!checking)return;
    try{
      const{data}=await bomAPI.checkAvailability(checking._id,{quantity:checkQty});
      setCheckResult(data);
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
  };

  const materialsProductIds = new Set(boms.map(b=>b.product?._id));

  return(
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Bill of Materials</div>
          <div className="page-subtitle">Define component recipes for each finished product</div>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowCreate(true)}}><Icon name="plus" size={15}/>New BOM</button>
      </div>

      <div className="grid-3 mb-6">
        <KpiCard label="Total BOMs"   value={total} icon="layers"  iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading}/>
        <KpiCard label="Active BOMs"  value={boms.filter(b=>b.status==='active').length} icon="check" iconColor="var(--success)" iconBg="var(--success-light)" loading={loading}/>
        <KpiCard label="Total Materials" value={boms.reduce((s,b)=>s+b.components.length,0)} icon="package" iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading}/>
      </div>

      <div className="card">
        <TableToolbar title={`BOMs (${total})`}/>
        <div className="table-wrap">
          {loading?<SkeletonTable rows={5} cols={6}/>:boms.length===0?(
            <EmptyState icon="layers" title="No BOMs defined" description="Create a Bill of Materials to define what raw materials each product needs."
              action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icon name="plus" size={14}/>New BOM</button>}/>
          ):(
            <table>
              <thead><tr><th>Product</th><th>Version</th><th>Components</th><th style={{textAlign:'right'}}>Material Cost</th><th style={{textAlign:'right'}}>Total Cost</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {boms.map(b=>(
                  <tr key={b._id}>
                    <td><span style={{fontWeight:600}}>{b.product?.name||'—'}</span><div style={{fontSize:11.5,color:'var(--text-muted)'}}>{b.product?.sku}</div></td>
                    <td><span className="mono">v{b.version}</span></td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{b.components.length} materials</td>
                    <td style={{textAlign:'right'}}>{fmt.currency(b.totalMaterialCost)}</td>
                    <td style={{textAlign:'right',fontWeight:600}}>{fmt.currency(b.totalCost)}</td>
                    <td><Badge status={b.status}/></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={()=>setViewBOM(b)}><Icon name="eye" size={13}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Check Availability" style={{color:'var(--primary)'}} onClick={()=>{setChecking(b);setCheckQty(1);setCheckResult(null);}}><Icon name="check" size={13}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleting(b)}><Icon name="trash" size={13}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total/20)} onPage={setPage}/>
      </div>

      {/* Create BOM Modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Create Bill of Materials" size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?<span className="spinner"/>:'Create BOM'}</button></>}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Finished Product *</label>
            <select className="input" value={form.product} onChange={e=>setForm({...form,product:e.target.value})}>
              <option value="">Select product…</option>
              {products.map(p=><option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Version</label><input className="input" placeholder="1.0" value={form.version} onChange={e=>setForm({...form,version:e.target.value})}/></div>
        </div>
        <hr className="divider"/>
        <div style={{fontWeight:600,fontSize:12,color:'var(--text-secondary)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Raw Materials / Components</div>
        {form.components.map((comp,idx)=>(
          <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 80px 60px 80px 30px',gap:8,marginBottom:8,alignItems:'end'}}>
            <div>{idx===0&&<label className="input-label">Material</label>}
              <select className="input" value={comp.material} onChange={e=>updateComp(idx,'material',e.target.value)}>
                <option value="">Select material…</option>
                {products.filter(p=>p._id!==form.product).map(p=><option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select></div>
            <div>{idx===0&&<label className="input-label">Qty</label>}
              <input className="input" type="number" min="0.001" step="0.001" value={comp.quantity} onChange={e=>updateComp(idx,'quantity',Number(e.target.value))}/></div>
            <div>{idx===0&&<label className="input-label">Unit</label>}
              <select className="input" value={comp.unit} onChange={e=>updateComp(idx,'unit',e.target.value)}>
                {['pcs','kg','m','L','sets','kits'].map(u=><option key={u}>{u}</option>)}
              </select></div>
            <div>{idx===0&&<label className="input-label">Scrap %</label>}
              <input className="input" type="number" min="0" max="100" value={comp.scrapFactor} onChange={e=>updateComp(idx,'scrapFactor',Number(e.target.value))}/></div>
            <div>{idx===0&&<label className="input-label">&nbsp;</label>}
              <button className="btn btn-ghost btn-icon" onClick={()=>removeComp(idx)} disabled={form.components.length===1}><Icon name="x" size={14}/></button></div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addComp} style={{marginBottom:16}}><Icon name="plus" size={13}/>Add Component</button>
        <hr className="divider"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Labor Hours</label><input className="input" type="number" min="0" value={form.laborHours} onChange={e=>setForm({...form,laborHours:Number(e.target.value)})}/></div>
          <div className="input-group"><label className="input-label">Labor Cost (₹)</label><input className="input" type="number" min="0" value={form.laborCost} onChange={e=>setForm({...form,laborCost:Number(e.target.value)})}/></div>
          <div className="input-group"><label className="input-label">Overhead (%)</label><input className="input" type="number" min="0" value={form.overheadPct} onChange={e=>setForm({...form,overheadPct:Number(e.target.value)})}/></div>
        </div>
      </Modal>

      {/* View BOM Modal */}
      <Modal isOpen={!!viewBOM} onClose={()=>setViewBOM(null)} title={`BOM — ${viewBOM?.product?.name||''}`} subtitle={`Version ${viewBOM?.version}`} size="lg"
        footer={<button className="btn btn-secondary" onClick={()=>setViewBOM(null)}>Close</button>}>
        {viewBOM&&(
          <div>
            <table style={{width:'100%',fontSize:13,marginBottom:20}}>
              <thead><tr style={{background:'var(--surface2)'}}>
                {['Material','SKU','Qty','Unit','Scrap%','Unit Cost','Total Cost'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:['Qty','Scrap%','Unit Cost','Total Cost'].includes(h)?'right':'left',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {viewBOM.components.map((c,i)=>{
                  const price=c.material?.price||0;
                  const netQty=c.quantity*(1+c.scrapFactor/100);
                  return(
                    <tr key={i} style={{borderBottom:'1px solid var(--border-light)'}}>
                      <td style={{padding:'10px'}}>{c.material?.name||c.name}</td>
                      <td style={{padding:'10px'}}><span className="mono">{c.material?.sku||c.sku}</span></td>
                      <td style={{padding:'10px',textAlign:'right'}}>{c.quantity}</td>
                      <td style={{padding:'10px'}}>{c.unit}</td>
                      <td style={{padding:'10px',textAlign:'right',color:'var(--warning)'}}>{c.scrapFactor}%</td>
                      <td style={{padding:'10px',textAlign:'right'}}>{fmt.currency(price)}</td>
                      <td style={{padding:'10px',textAlign:'right',fontWeight:600}}>{fmt.currency(netQty*price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{background:'var(--surface2)',borderRadius:'var(--radius-md)',padding:'14px 16px'}}>
              {[
                ['Material Cost',fmt.currency(viewBOM.totalMaterialCost)],
                ['Labor Cost',   fmt.currency(viewBOM.laborCost)],
                ['Overhead ('+viewBOM.overheadPct+'%)', fmt.currency((viewBOM.totalMaterialCost+viewBOM.laborCost)*viewBOM.overheadPct/100)],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13,borderBottom:'1px solid var(--border-light)'}}><span style={{color:'var(--text-secondary)'}}>{k}</span><span>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontWeight:700,fontSize:15}}><span>Total Cost / Unit</span><span style={{color:'var(--primary)'}}>{fmt.currency(viewBOM.totalCost)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Check Availability Modal */}
      <Modal isOpen={!!checking} onClose={()=>{setChecking(null);setCheckResult(null);}} title="Check Material Availability" subtitle={checking?.product?.name} size="md"
        footer={<><button className="btn btn-secondary" onClick={()=>{setChecking(null);setCheckResult(null);}}>Close</button><button className="btn btn-primary" onClick={handleCheckAvailability}><Icon name="check" size={14}/>Check</button></>}>
        {checking&&(
          <div>
            <div className="input-group"><label className="input-label">Production Quantity</label>
              <input className="input" type="number" min="1" value={checkQty} onChange={e=>setCheckQty(Number(e.target.value))}/></div>
            {checkResult&&(
              <div>
                <div style={{padding:'10px 14px',borderRadius:'var(--radius-md)',marginBottom:12,background:checkResult.canProduce?'var(--success-light)':'var(--danger-light)',border:`1px solid ${checkResult.canProduce?'#6CE9A6':'#FDA29B'}`,display:'flex',alignItems:'center',gap:10}}>
                  <Icon name={checkResult.canProduce?'check':'x'} size={16} style={{color:checkResult.canProduce?'var(--success)':'var(--danger)'}}/>
                  <span style={{fontSize:13,fontWeight:600,color:checkResult.canProduce?'#027A48':'#B42318'}}>
                    {checkResult.canProduce?`Can produce ${checkQty} units — all materials available`:`Cannot produce — ${checkResult.components.filter(c=>!c.sufficient).length} materials short`}
                  </span>
                </div>
                <table style={{width:'100%',fontSize:12.5}}>
                  <thead><tr style={{background:'var(--surface2)'}}>
                    {['Material','Needed','Available','Shortage'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:h==='Material'?'left':'right',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {checkResult.components.map((c,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--border-light)',background:!c.sufficient?'var(--danger-light)':''}}>
                        <td style={{padding:'8px 10px',fontWeight:500}}>{c.material}</td>
                        <td style={{padding:'8px 10px',textAlign:'right'}}>{c.needed}</td>
                        <td style={{padding:'8px 10px',textAlign:'right'}}>{c.available}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',color:c.shortage>0?'var(--danger)':'var(--success)',fontWeight:600}}>{c.shortage>0?`-${c.shortage}`:'✓'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={()=>setDeleting(null)} onConfirm={async()=>{await bomAPI.remove(deleting._id);setDeleting(null);toast.success('BOM deleted');load();}} title="Delete BOM" message={`Delete BOM for "${deleting?.product?.name}"?`}/>
    </div>
  );
}
