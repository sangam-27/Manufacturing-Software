// TasksPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchTasks, createTask, updateTask, deleteTask } from '../store/slices/tasksSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { Icon, Badge, Modal, EmptyState, ConfirmDialog, ProgressBar, fmt } from '../components/ui';

const COLS = [
  { id: 'todo',        label: 'To Do',      color: 'var(--text-muted)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--primary)' },
  { id: 'done',        label: 'Done',        color: 'var(--success)' },
];

export function TasksPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { items: tasks, loading } = useSelector(s => s.tasks);
  const { items: users } = useSelector(s => s.users);

  const [showCreate, setShowCreate] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });

  const isSuperPlus = ['admin', 'supervisor'].includes(user.role);

  useEffect(() => { dispatch(fetchTasks()); if (isSuperPlus) dispatch(fetchUsers()); }, []);

  const handleMove = async (task, status) => {
    const result = await dispatch(updateTask({ id: task._id, status, progress: status === 'done' ? 100 : status === 'in_progress' ? 50 : 0 }));
    if (!result.error) toast.success('Task updated');
    else toast.error(result.payload || 'Failed');
  };

  const handleCreate = async () => {
    if (!form.title || !form.assignedTo) { toast.error('Title and assignee are required'); return; }
    setSaving(true);
    const result = await dispatch(createTask(form));
    setSaving(false);
    if (!result.error) { toast.success('Task created'); setShowCreate(false); setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' }); }
    else toast.error(result.payload || 'Failed');
  };

  const highCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle">Track your assigned work items</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {highCount > 0 && <span className="badge badge-danger"><span className="badge-dot" />{highCount} High Priority</span>}
          {isSuperPlus && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={15} />New Task</button>}
        </div>
      </div>

      <div className="kanban">
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id}>
              <div className="kanban-header mb-3">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--surface2)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99 }}>{colTasks.length}</span>
              </div>
              <div className="kanban-col">
                {colTasks.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 13 }}>Empty</div>
                ) : colTasks.map(task => (
                  <div key={task._id} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, flex: 1, marginRight: 8 }}>{task.title}</div>
                      <Badge status={task.priority} />
                    </div>
                    {task.order && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                        <span className="mono">{task.order?.orderId || 'Standalone'}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock" size={11} />Due {fmt.dateShort(task.dueDate)}
                      </div>
                    )}
                    {task.status !== 'todo' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 3 }}>
                          <span>Progress</span><span>{task.progress}%</span>
                        </div>
                        <ProgressBar value={task.progress} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {col.id === 'todo'        && <button className="btn btn-primary btn-sm"    onClick={() => handleMove(task, 'in_progress')}>Start</button>}
                      {col.id === 'in_progress' && <button className="btn btn-secondary btn-sm" onClick={() => handleMove(task, 'done')}><Icon name="check" size={12} />Mark Done</button>}
                      {col.id === 'done'        && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />Completed</span>}
                      {isSuperPlus && <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto', color: 'var(--danger)' }} onClick={() => setDeleting(task)}><Icon name="trash" size={12} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <span className="spinner" /> : 'Create'}</button></>}>
        <div className="input-group"><label className="input-label">Task Title *</label><input className="input" placeholder="e.g. Machine calibration" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Assign To *</label>
          <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Select worker…</option>
            {users.filter(u => u.status === 'active').map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select></div>
          <div className="input-group"><label className="input-label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
        </div>
        <div className="input-group"><label className="input-label">Description</label><textarea className="input" rows={2} placeholder="Details…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={async () => { await dispatch(deleteTask(deleting._id)); setDeleting(null); toast.success('Task deleted'); }} title="Delete Task" message={`Delete task "${deleting?.title}"?`} />
    </div>
  );
}
