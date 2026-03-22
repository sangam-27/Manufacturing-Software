import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { shiftsAPI, usersAPI } from '../services/api';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, Avatar, fmt } from '../components/ui';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();

export default function ShiftsPage() {
  const [tab, setTab] = useState('schedule');
  return (
    <div>
      <div className="page-header" style={{display:'block'}}>
        <div className="page-title">Shift Scheduling</div>
        <div className="page-subtitle">Manage work shifts and track attendance</div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid var(--border)'}}>
        {[{id:'schedule',label:'Shift Schedule',icon:'clipboard'},{id:'attendance',label:'Attendance Report',icon:'chart'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="btn btn-ghost"
            style={{borderBottom:tab===t.id?'2px solid var(--primary)':'2px solid transparent',borderRadius:0,color:tab===t.id?'var(--primary)':'var(--text-secondary)',paddingBottom:12,fontWeight:tab===t.id?600:400}}>
            <Icon name={t.icon} size={15}/>{t.label}
          </button>
        ))}
      </div>
      {tab==='schedule'  &&<ShiftScheduleTab/>}
      {tab==='attendance'&&<AttendanceTab/>}
    </div>
  );
}

function ShiftScheduleTab(){
  const [shifts,    setShifts]    = useState([]);
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [showCreate,setShowCreate]= useState(false);
  const [viewShift, setViewShift] = useState(null);
  const [attendModal,setAttendModal]=useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [saving,    setSaving]    = useState(false);

  const emptyForm={name:'',date:'',startTime:'08:00',endTime:'16:00',department:'',supervisor:'',assignedWorkers:[],notes:''};
  const [form,setForm]=useState(emptyForm);
  const [attendForm,setAttendForm]=useState([]);

  useEffect(()=>{load();},[page]);
  useEffect(()=>{loadUsers();},[]);

  const load=async()=>{
    setLoading(true);
    try{const{data}=await shiftsAPI.getAll({page});setShifts(data.data);setTotal(data.total);}
    catch{toast.error('Failed to load shifts');}
    finally{setLoading(false);}
  };
  const loadUsers=async()=>{try{const{data}=await usersAPI.getAll({limit:100});setUsers(data.data);}catch{}};

  const toggleWorker=(uid)=>{
    const cur=form.assignedWorkers;
    setForm({...form,assignedWorkers:cur.includes(uid)?cur.filter(x=>x!==uid):[...cur,uid]});
  };

  const handleCreate=async()=>{
    if(!form.name||!form.date){toast.error('Name and date required');return;}
    setSaving(true);
    try{await shiftsAPI.create(form);toast.success('Shift created');setShowCreate(false);setForm(emptyForm);load();}
    catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const openAttendance=(shift)=>{
    const entries=shift.assignedWorkers.map(w=>({
      user: w._id||w, userName: w.name||'',
      status:'present',checkIn:'',checkOut:'',note:'',
    }));
    setAttendForm(entries); setAttendModal(shift);
  };

  const handleMarkAttendance=async()=>{
    setSaving(true);
    try{
      await shiftsAPI.markAttendance(attendModal._id,{attendance:attendForm.map(a=>({...a,checkIn:a.checkIn?new Date(a.checkIn):null,checkOut:a.checkOut?new Date(a.checkOut):null}))});
      toast.success('Attendance marked');setAttendModal(null);setAttendForm([]);load();
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };

  const upcoming = shifts.filter(s=>s.status==='upcoming').length;
  const ongoing  = shifts.filter(s=>s.status==='ongoing').length;
  const completed= shifts.filter(s=>s.status==='completed').length;

  return(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowCreate(true)}}><Icon name="plus" size={15}/>New Shift</button>
      </div>

      <div className="grid-4 mb-6">
        <KpiCard label="Total Shifts"  value={total}     icon="clipboard" iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading}/>
        <KpiCard label="Upcoming"      value={upcoming}  icon="clock"     iconColor="var(--warning)" iconBg="var(--warning-light)" loading={loading}/>
        <KpiCard label="Ongoing"       value={ongoing}   icon="activity"  iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading}/>
        <KpiCard label="Completed"     value={completed} icon="check"     iconColor="var(--success)" iconBg="var(--success-light)" loading={loading}/>
      </div>

      <div className="card">
        <TableToolbar title={`Shifts (${total})`}/>
        <div className="table-wrap">
          {loading?<SkeletonTable rows={5} cols={7}/>:shifts.length===0?(
            <EmptyState icon="clipboard" title="No shifts scheduled" description="Create your first shift to start managing workers."
              action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icon name="plus" size={14}/>New Shift</button>}/>
          ):(
            <table>
              <thead><tr><th>Shift Name</th><th>Date</th><th>Time</th><th>Department</th><th>Workers</th><th>Supervisor</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {shifts.map(s=>(
                  <tr key={s._id}>
                    <td style={{fontWeight:600}}>{s.name}</td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{fmt.date(s.date)}</td>
                    <td><span className="mono" style={{fontSize:12}}>{s.startTime} – {s.endTime}</span></td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{s.department||'—'}</td>
                    <td>
                      <div style={{display:'flex',gap:-4}}>
                        {s.assignedWorkers?.slice(0,3).map((w,i)=>(
                          <div key={i} style={{marginLeft:i>0?-6:0}}><Avatar name={typeof w==='object'?w.name:w} size={22} role="user"/></div>
                        ))}
                        {s.assignedWorkers?.length>3&&<span style={{fontSize:11,color:'var(--text-secondary)',marginLeft:4}}>+{s.assignedWorkers.length-3}</span>}
                        {(!s.assignedWorkers||s.assignedWorkers.length===0)&&<span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}
                      </div>
                    </td>
                    <td>{s.supervisor?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar name={s.supervisor.name} size={22} role="supervisor"/><span style={{fontSize:12.5}}>{s.supervisor.name}</span></div>:'—'}</td>
                    <td><Badge status={s.status}/></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setViewShift(s)}><Icon name="eye" size={13}/></button>
                      {s.status!=='completed'&&<button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--success)'}} title="Mark Attendance" onClick={()=>openAttendance(s)}><Icon name="check" size={13}/></button>}
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

      {/* Create Shift Modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Create Shift" size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?<span className="spinner"/>:'Create Shift'}</button></>}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="input-group"><label className="input-label">Shift Name *</label><input className="input" placeholder="Morning Shift A" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Date *</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Start Time</label><input className="input" type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">End Time</label><input className="input" type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Department</label><input className="input" placeholder="Production / Quality…" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">Supervisor</label>
            <select className="input" value={form.supervisor} onChange={e=>setForm({...form,supervisor:e.target.value})}>
              <option value="">Select supervisor…</option>
              {users.filter(u=>['admin','supervisor'].includes(u.role)).map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
            </select></div>
        </div>
        <div className="input-group"><label className="input-label" style={{marginBottom:10}}>Assign Workers</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {users.filter(u=>u.role==='user'&&u.status==='active').map(u=>(
              <label key={u._id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:`1px solid ${form.assignedWorkers.includes(u._id)?'var(--primary)':'var(--border)'}`,borderRadius:'var(--radius-md)',cursor:'pointer',background:form.assignedWorkers.includes(u._id)?'var(--primary-light)':'',transition:'var(--tr)'}}>
                <input type="checkbox" checked={form.assignedWorkers.includes(u._id)} onChange={()=>toggleWorker(u._id)} style={{accentColor:'var(--primary)'}}/>
                <Avatar name={u.name} size={22} role="user"/>
                <span style={{fontSize:13,fontWeight:500}}>{u.name}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={!!attendModal} onClose={()=>setAttendModal(null)} title="Mark Attendance" subtitle={`${attendModal?.name} · ${fmt.date(attendModal?.date)}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={()=>setAttendModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleMarkAttendance} disabled={saving}>{saving?<span className="spinner"/>:'Save Attendance'}</button></>}>
        {attendForm.map((a,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'130px 100px 130px 130px 1fr',gap:8,alignItems:'end',marginBottom:10,padding:'10px',background:'var(--surface2)',borderRadius:'var(--radius-md)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={a.userName} size={24} role="user"/><span style={{fontSize:12.5,fontWeight:500}}>{a.userName}</span></div>
            <select className="input" style={{height:32}} value={a.status} onChange={e=>{const f=[...attendForm];f[i]={...f[i],status:e.target.value};setAttendForm(f);}}>
              <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half Day</option><option value="late">Late</option>
            </select>
            <input className="input" type="time" style={{height:32}} value={a.checkIn} onChange={e=>{const f=[...attendForm];f[i]={...f[i],checkIn:e.target.value};setAttendForm(f);}} placeholder="Check In"/>
            <input className="input" type="time" style={{height:32}} value={a.checkOut} onChange={e=>{const f=[...attendForm];f[i]={...f[i],checkOut:e.target.value};setAttendForm(f);}} placeholder="Check Out"/>
            <input className="input" style={{height:32}} placeholder="Note…" value={a.note} onChange={e=>{const f=[...attendForm];f[i]={...f[i],note:e.target.value};setAttendForm(f);}}/>
          </div>
        ))}
        {attendForm.length===0&&<div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>No workers assigned to this shift</div>}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={()=>setDeleting(null)} onConfirm={async()=>{await shiftsAPI.remove(deleting._id);setDeleting(null);toast.success('Shift deleted');load();}} title="Delete Shift" message={`Delete "${deleting?.name}"?`}/>
      {/* View Shift Modal */}
      <Modal isOpen={!!viewShift} onClose={()=>setViewShift(null)} title={viewShift?.name||''} subtitle={`${fmt.date(viewShift?.date)} · ${viewShift?.startTime} – ${viewShift?.endTime}`} size="md"
        footer={<button className="btn btn-secondary" onClick={()=>setViewShift(null)}>Close</button>}>
        {viewShift&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {[['Department',viewShift.department||'—'],['Supervisor',viewShift.supervisor?.name||'—'],['Workers',viewShift.assignedWorkers?.length||0],['Status','']].map(([k,v])=>(
                <div key={k}><div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>{k}</div>
                  {k==='Status'?<Badge status={viewShift.status}/>:<div style={{fontSize:13.5,fontWeight:500}}>{v}</div>}
                </div>
              ))}
            </div>
            {viewShift.attendance?.length>0&&(
              <div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Attendance</div>
                <table style={{width:'100%',fontSize:13}}>
                  <thead><tr style={{background:'var(--surface2)'}}>{['Worker','Status','Hours','Overtime'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>{h}</th>)}</tr></thead>
                  <tbody>{viewShift.attendance.map((a,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid var(--border-light)'}}>
                      <td style={{padding:'8px 10px'}}>{a.user?.name||'—'}</td>
                      <td style={{padding:'8px 10px'}}><Badge status={a.status}/></td>
                      <td style={{padding:'8px 10px'}}>{a.hoursWorked}h</td>
                      <td style={{padding:'8px 10px',color:a.overtime>0?'var(--warning)':''}}>{a.overtime>0?`+${a.overtime}h`:'—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function AttendanceTab(){
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [month,   setMonth]   = useState(NOW.getMonth()+1);
  const [year,    setYear]    = useState(NOW.getFullYear());

  useEffect(()=>{load();},[month,year]);

  const load=async()=>{
    setLoading(true);
    try{const{data}=await shiftsAPI.getAttendanceReport({month,year});setReport(data.data);}
    catch{toast.error('Failed to load report');}
    finally{setLoading(false);}
  };

  const exportCSV=()=>{
    if(!report?.length)return;
    const keys=Object.keys(report[0]);
    const csv=[keys.join(','),...report.map(r=>keys.map(k=>`"${r[k]??''}"`).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`Attendance_${MONTHS[month-1]}_${year}.csv`;a.click();
  };

  return(
    <div>
      <div className="flex items-center gap-3 mb-6">
        <select className="input" style={{width:140}} value={month} onChange={e=>setMonth(Number(e.target.value))}>
          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="input" style={{width:100}} value={year} onChange={e=>setYear(Number(e.target.value))}>
          {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={load}><Icon name="refresh" size={14}/>Refresh</button>
        {report&&<button className="btn btn-secondary" style={{marginLeft:'auto'}} onClick={exportCSV}><Icon name="download" size={14}/>Export CSV</button>}
      </div>

      <div className="card">
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14}}>
          Attendance Report — {MONTHS[month-1]} {year}
        </div>
        <div className="table-wrap">
          {loading?<SkeletonTable rows={5} cols={7}/>:!report||report.length===0?(
            <EmptyState icon="clipboard" title="No attendance data" description="No completed shifts found for this period."/>
          ):(
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th style={{textAlign:'right'}}>Present</th><th style={{textAlign:'right'}}>Absent</th><th style={{textAlign:'right'}}>Late</th><th style={{textAlign:'right'}}>Half Day</th><th style={{textAlign:'right'}}>Total Hours</th><th style={{textAlign:'right'}}>Overtime</th></tr></thead>
              <tbody>
                {report.map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.name}</td>
                    <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{r.department||'—'}</td>
                    <td style={{textAlign:'right',color:'var(--success)',fontWeight:600}}>{r.present}</td>
                    <td style={{textAlign:'right',color:r.absent>0?'var(--danger)':'var(--text-secondary)'}}>{r.absent}</td>
                    <td style={{textAlign:'right',color:r.late>0?'var(--warning)':'var(--text-secondary)'}}>{r.late}</td>
                    <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{r.halfDay}</td>
                    <td style={{textAlign:'right',fontWeight:500}}>{r.totalHours.toFixed(1)}h</td>
                    <td style={{textAlign:'right',color:r.overtime>0?'var(--warning)':''}}>{r.overtime>0?`+${r.overtime.toFixed(1)}h`:'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
