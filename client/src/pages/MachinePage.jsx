import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { machinesAPI, usersAPI } from '../services/api';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, Avatar, fmt } from '../components/ui';

const STATUS_COLORS = {
  operational:    'badge-success',
  maintenance:    'badge-warning',
  breakdown:      'badge-danger',
  idle:           'badge-gray',
  decommissioned: 'badge-gray',
};

export default function MachinePage() {
  const [machines,  setMachines]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [dueSoon,   setDueSoon]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [statusF,   setStatusF]   = useState('');
  const [showCreate,setShowCreate]= useState(false);
  const [viewMachine,setViewMachine]=useState(null);
  const [logModal,  setLogModal]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [saving,    setSaving]    = useState(false);

  const emptyForm={name:'',category:'',location:'',manufacturer:'',model:'',serialNumber:'',purchaseCost:0,maintenanceIntervalDays:30,assignedTo:'',notes:''};
  const [form,setForm]=useState(emptyForm);
  const [logForm,setLogForm]=useState({type:'preventive',description:'',cost:0,technician:'',startTime:'',endTime:'',status:'done'});

  useEffect(()=>{load();},[statusF,page]);
  useEffect(()=>{ loadUsers(); loadDue(); },[]);

  const load=async()=>{
    setLoading(true);
    try{const{data}=await machinesAPI.getAll({status:statusF,page});setMachines(data.data);setTotal(data.total);}
    catch{toast.error('Failed to load machines');}
    finally{setLoading(false);}
  };
  const loadUsers=async()=>{ try{const{data}=await usersAPI.getAll({limit:100});setUsers(data.data);}catch{} };
  const loadDue=async()=>{ try{const{data}=await machinesAPI.getDueMaintenance();setDueSoon(data.data);}catch{} };

  const handleCreate=async()=>{
    if(!form.name){toast.error('Machine name required');return;}
    setSaving(true);
    try{await machinesAPI.create(form);toast.success('Machine added');setShowCreate(false);setForm(emptyForm);load();}
    catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const handleAddLog=async()=>{
    if(!logForm.description){toast.error('Description required');return;}
    setSaving(true);
    try{
      await machinesAPI.addMaintenance(logModal._id,logForm);
      toast.success('Maintenance log added');setLogModal(null);setLogForm({type:'preventive',description:'',cost:0,technician:'',startTime:'',endTime:'',status:'done'});load();loadDue();
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const operational = machines.filter(m=>m.status==='operational').length;
  const breakdown   = machines.filter(m=>m.status==='breakdown').length;
  const maintenance = machines.filter(m=>m.status==='maintenance').length;

  return(
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Machine Maintenance</div>
          <div className="page-subtitle">Track machine health, maintenance schedules and breakdowns</div>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowCreate(true)}}><Icon name="plus" size={15}/>Add Machine</button>
      </div>

      <div className="grid-4 mb-6">
        <KpiCard label="Total Machines"  value={total}       icon="layers"    iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading}/>
        <KpiCard label="Operational"     value={operational} icon="check"     iconColor="var(--success)" iconBg="var(--success-light)" loading={loading}/>
        <KpiCard label="In Maintenance"  value={maintenance} icon="refresh"   iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading}/>
        <KpiCard label="Breakdown"       value={breakdown}   icon="alert"     iconColor="var(--danger)"  iconBg="var(--danger-light)"  loading={loading}/>
      </div>

      {/* Due maintenance alert */}
      {dueSoon.length>0&&(
        <div className="alert alert-warning mb-4">
          <Icon name="alert" size={16} style={{flexShrink:0,marginTop:1}}/>
          <div style={{fontSize:13}}>
            <strong>{dueSoon.length} machine{dueSoon.length!==1?'s':''}</strong> due for maintenance within 7 days:&nbsp;
            {dueSoon.slice(0,3).map(m=>m.name).join(', ')}{dueSoon.length>3?'…':''}
          </div>
        </div>
      )}

      <div className="card">
        <TableToolbar title={`Machines (${total})`}>
          <select className="input" style={{height:34,width:160}} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1)}}>
            <option value="">All Status</option>
            <option value="operational">Operational</option><option value="maintenance">In Maintenance</option>
            <option value="breakdown">Breakdown</option><option value="idle">Idle</option>
          </select>
        </TableToolbar>
        <div className="table-wrap">
          {loading?<SkeletonTable rows={5} cols={7}/>:machines.length===0?(
            <EmptyState icon="layers" title="No machines" description="Add your first machine to start tracking maintenance."
              action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icon name="plus" size={14}/>Add Machine</button>}/>
          ):(
            <table>
              <thead><tr><th>Machine</th><th>ID</th><th>Location</th><th>Assigned To</th><th>Last Maintenance</th><th>Next Maintenance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {machines.map(m=>{
                  const isOverdue = m.nextMaintenanceDate && new Date(m.nextMaintenanceDate)<new Date();
                  const isDueSoon = m.nextMaintenanceDate && !isOverdue && (new Date(m.nextMaintenanceDate)-new Date())/(1000*60*60*24)<=7;
                  return(
                    <tr key={m._id}>
                      <td>
                        <div style={{fontWeight:600}}>{m.name}</div>
                        <div style={{fontSize:11.5,color:'var(--text-secondary)'}}>{m.manufacturer} {m.model}</div>
                      </td>
                      <td><span className="mono">{m.machineId}</span></td>
                      <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{m.location||'—'}</td>
                      <td>{m.assignedTo?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar name={m.assignedTo.name} size={22} role="user"/><span style={{fontSize:12.5}}>{m.assignedTo.name}</span></div>:'—'}</td>
                      <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{m.lastMaintenanceDate?fmt.date(m.lastMaintenanceDate):'Never'}</td>
                      <td>
                        <span style={{fontSize:12.5,fontWeight:500,color:isOverdue?'var(--danger)':isDueSoon?'var(--warning)':'var(--text-secondary)'}}>
                          {m.nextMaintenanceDate?fmt.date(m.nextMaintenanceDate):'—'}
                          {isOverdue&&<span style={{fontSize:11,marginLeft:6,fontWeight:600}}>(OVERDUE)</span>}
                        </span>
                      </td>
                      <td><Badge status={m.status}/></td>
                      <td><div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={()=>setViewMachine(m)}><Icon name="eye" size={13}/></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Add Log" style={{color:'var(--primary)'}} onClick={()=>setLogModal(m)}><Icon name="plus" size={13}/></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleting(m)}><Icon name="trash" size={13}/></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pages={Math.ceil(total/20)} onPage={setPage}/>
      </div>

      {/* Create Machine Modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Add Machine" size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?<span className="spinner"/>:'Add Machine'}</button></>}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Machine Name *</label><input className="input" placeholder="CNC Lathe Machine" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Category</label><input className="input" placeholder="CNC / Lathe / Press…" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Manufacturer</label><input className="input" placeholder="Mazak / Fanuc…" value={form.manufacturer} onChange={e=>setForm({...form,manufacturer:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Model</label><input className="input" placeholder="QT-200N" value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Serial Number</label><input className="input" placeholder="SN-12345" value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Location</label><input className="input" placeholder="Shop Floor A, Bay 3" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Purchase Cost (₹)</label><input className="input" type="number" min="0" value={form.purchaseCost} onChange={e=>setForm({...form,purchaseCost:Number(e.target.value)})}/></div>
          <div className="input-group"><label className="input-label">Maintenance Every (days)</label><input className="input" type="number" min="1" value={form.maintenanceIntervalDays} onChange={e=>setForm({...form,maintenanceIntervalDays:Number(e.target.value)})}/></div>
          <div className="input-group" style={{gridColumn:'1/-1'}}><label className="input-label">Assign To</label>
            <select className="input" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
              <option value="">None</option>
              {users.filter(u=>u.status==='active').map(u=><option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select></div>
        </div>
        <div className="input-group"><label className="input-label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </Modal>

      {/* View Machine Modal */}
      <Modal isOpen={!!viewMachine} onClose={()=>setViewMachine(null)} title={viewMachine?.name||''} subtitle={`${viewMachine?.machineId} · ${viewMachine?.location||'No location'}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setViewMachine(null)}>Close</button><button className="btn btn-primary" onClick={()=>{setLogModal(viewMachine);setViewMachine(null);}}>Add Maintenance Log</button></>}>
        {viewMachine&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
              {[['Manufacturer',viewMachine.manufacturer||'—'],['Model',viewMachine.model||'—'],['Serial No.',viewMachine.serialNumber||'—'],
                ['Purchase Cost',fmt.currency(viewMachine.purchaseCost)],['Interval',`${viewMachine.maintenanceIntervalDays} days`],['Category',viewMachine.category||'—']].map(([k,v])=>(
                <div key={k}><div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k}</div><div style={{fontSize:13.5,fontWeight:500}}>{v}</div></div>
              ))}
            </div>
            <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Maintenance History</div>
            {viewMachine.maintenanceLogs?.length===0?(
              <div style={{color:'var(--text-muted)',fontSize:13,padding:'16px 0'}}>No maintenance logs yet</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {viewMachine.maintenanceLogs?.slice(0,8).map((log,i)=>(
                  <div key={i} style={{padding:'10px 14px',background:'var(--surface2)',borderRadius:'var(--radius-md)',display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:log.type==='breakdown'?'var(--danger)':log.type==='corrective'?'var(--warning)':'var(--success)',flexShrink:0,marginTop:5}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{log.description}</div>
                      <div style={{fontSize:11.5,color:'var(--text-secondary)',marginTop:2}}>
                        {log.type} · {log.technician||log.performedBy?.name||'System'} · Cost: {fmt.currency(log.cost)}
                      </div>
                    </div>
                    <div style={{fontSize:11.5,color:'var(--text-muted)',flexShrink:0}}>{fmt.timeAgo(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Maintenance Log Modal */}
      <Modal isOpen={!!logModal} onClose={()=>setLogModal(null)} title="Add Maintenance Log" subtitle={logModal?.name} size="sm"
        footer={<><button className="btn btn-secondary" onClick={()=>setLogModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleAddLog} disabled={saving}>{saving?<span className="spinner"/>:'Add Log'}</button></>}>
        <div className="input-group"><label className="input-label">Type</label>
          <select className="input" value={logForm.type} onChange={e=>setLogForm({...logForm,type:e.target.value})}>
            <option value="preventive">Preventive</option><option value="corrective">Corrective</option><option value="breakdown">Breakdown</option>
          </select></div>
        <div className="input-group"><label className="input-label">Description *</label><textarea className="input" rows={3} placeholder="What was done…" value={logForm.description} onChange={e=>setLogForm({...logForm,description:e.target.value})}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Cost (₹)</label><input className="input" type="number" min="0" value={logForm.cost} onChange={e=>setLogForm({...logForm,cost:Number(e.target.value)})}/></div>
          <div className="input-group"><label className="input-label">Technician</label><input className="input" placeholder="Name" value={logForm.technician} onChange={e=>setLogForm({...logForm,technician:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Start Time</label><input className="input" type="datetime-local" value={logForm.startTime} onChange={e=>setLogForm({...logForm,startTime:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">End Time</label><input className="input" type="datetime-local" value={logForm.endTime} onChange={e=>setLogForm({...logForm,endTime:e.target.value})}/></div>
        </div>
        <div className="input-group"><label className="input-label">Status</label>
          <select className="input" value={logForm.status} onChange={e=>setLogForm({...logForm,status:e.target.value})}>
            <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="done">Done</option>
          </select></div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={()=>setDeleting(null)} onConfirm={async()=>{await machinesAPI.remove(deleting._id);setDeleting(null);toast.success('Machine deleted');load();}} title="Delete Machine" message={`Delete "${deleting?.name}"?`}/>
    </div>
  );
}
