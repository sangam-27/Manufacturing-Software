import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchUsers, createUser, updateUser, deleteUser } from '../store/slices/usersSlice';
import { Icon, Badge, Modal, KpiCard, EmptyState, SkeletonTable, ConfirmDialog, TableToolbar, Pagination, Avatar, fmt } from '../components/ui';

export default function UsersPage() {
  const dispatch = useDispatch();
  const { items: users, total, loading } = useSelector(s => s.users);

  const [showCreate, setShowCreate]   = useState(false);
  const [editItem,   setEditItem]     = useState(null);
  const [deleting,   setDeleting]     = useState(null);
  const [saving,     setSaving]       = useState(false);
  const [search,     setSearch]       = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [page,       setPage]         = useState(1);

  const emptyForm = { name: '', email: '', password: '', role: 'user', department: '', status: 'active' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchUsers({ search, role: roleFilter, page })), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, roleFilter, page]);

  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', status: u.status }); setEditItem(u); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editItem && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    const result = editItem
      ? await dispatch(updateUser({ id: editItem._id, name: form.name, role: form.role, department: form.department, status: form.status }))
      : await dispatch(createUser(form));
    setSaving(false);
    if (!result.error) { toast.success(editItem ? 'User updated' : 'User created'); setShowCreate(false); setEditItem(null); setForm(emptyForm); }
    else toast.error(result.payload || 'Failed');
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    const result = await dispatch(updateUser({ id: u._id, status: newStatus }));
    if (!result.error) toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    else toast.error(result.payload || 'Failed');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteUser(deleting._id));
    if (!result.error) { toast.success('User deleted'); setDeleting(null); }
    else toast.error(result.payload || 'Cannot delete this user');
  };

  const admins      = users.filter(u => u.role === 'admin').length;
  const supervisors = users.filter(u => u.role === 'supervisor').length;
  const workers     = users.filter(u => u.role === 'user').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">User Management</div>
          <div className="page-subtitle">Manage team members, roles and access</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditItem(null); setShowCreate(true); }}><Icon name="plus" size={15} />Add User</button>
      </div>

      <div className="grid-4 mb-6">
        <KpiCard label="Total Users"  value={total}      icon="users"  iconColor="var(--primary)" iconBg="var(--primary-light)" loading={loading} />
        <KpiCard label="Admins"       value={admins}     icon="user"   iconColor="var(--purple)"  iconBg="var(--purple-light)"  loading={loading} />
        <KpiCard label="Supervisors"  value={supervisors} icon="layers" iconColor="#0891B2"        iconBg="#E0F2FE"              loading={loading} />
        <KpiCard label="Workers"      value={workers}    icon="activity" iconColor="var(--success)" iconBg="var(--success-light)" loading={loading} />
      </div>

      <div className="card">
        <TableToolbar title={`Team Members (${total})`}>
          <input className="input" style={{ height: 34, width: 200 }} placeholder="Search name, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="input" style={{ height: 34, width: 150 }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option><option value="supervisor">Supervisor</option><option value="user">Worker</option>
          </select>
        </TableToolbar>

        <div className="table-wrap">
          {loading ? <SkeletonTable rows={5} cols={6} /> : users.length === 0 ? (
            <EmptyState icon="users" title="No users found" description="Add your first team member to get started."
              action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={14} />Add User</button>} />
          ) : (
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} size={32} role={u.role} />
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><Badge status={u.role} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                    <td><Badge status={u.status} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{u.lastLogin ? fmt.timeAgo(u.lastLogin) : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(u)}><Icon name="edit" size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={u.status === 'active' ? 'Deactivate' : 'Activate'} style={{ color: u.status === 'active' ? 'var(--warning)' : 'var(--success)' }} onClick={() => toggleStatus(u)}>
                          <Icon name={u.status === 'active' ? 'x' : 'check'} size={13} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(u)}><Icon name="trash" size={13} /></button>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreate || !!editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} title={editItem ? 'Edit User' : 'Add New User'} subtitle={editItem ? `Editing ${editItem.name}` : 'Create a new team member account'}
        footer={<><button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : editItem ? 'Save Changes' : 'Add User'}</button></>}>
        <div className="input-group"><label className="input-label">Full Name *</label><input className="input" placeholder="e.g. Rahul Verma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="input-group"><label className="input-label">Email Address *</label><input className="input" type="email" placeholder="rahul@manufos.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editItem} /></div>
        {!editItem && (
          <div className="input-group"><label className="input-label">Password *</label><input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group"><label className="input-label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">Worker</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option>
            </select></div>
          <div className="input-group"><label className="input-label">Department</label><input className="input" placeholder="e.g. Production" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
        </div>
        {editItem && (
          <div className="input-group"><label className="input-label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select></div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete User" message={`Delete user "${deleting?.name}"? This action cannot be undone.`} />
    </div>
  );
}
