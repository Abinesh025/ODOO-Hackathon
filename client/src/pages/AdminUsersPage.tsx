import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type U = {
  _id: string;
  name: string;
  email: string;
  role: string;
  managerId?: string | null;
  isActive?: boolean;
};

/* ── tiny icon components ── */
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6.5a.75.75 0 01-1.49.115l-.5-6.5a.75.75 0 01.71-.835zm2.84 0a.75.75 0 01.72.835l-.5 6.5a.75.75 0 01-1.49-.115l.5-6.5a.75.75 0 01.77-.72z" clipRule="evenodd" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

const roleBadgeClasses: Record<string, string> = {
  admin:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50',
  manager:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50',
  employee:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50',
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'manager',
    managerId: '' as string,
  });

  /* ── Edit modal state ── */
  const [editUser, setEditUser] = useState<U | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'employee' as 'employee' | 'manager' | 'admin',
    managerId: '' as string,
  });

  /* ── Delete confirmation state ── */
  const [deleteTarget, setDeleteTarget] = useState<U | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api.get('/users').then((r) => {
        setUsers(r.data.users);
      }),
    []
  );

  useEffect(() => {
    load()
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [load]);

  /* ── Create ── */
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/users', {
        ...form,
        managerId: form.managerId || null,
      });
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'employee', managerId: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  /* ── Open edit modal ── */
  function openEdit(u: U) {
    setEditUser(u);
    setEditForm({
      name: u.name,
      role: u.role as 'employee' | 'manager' | 'admin',
      managerId: u.managerId || '',
    });
  }

  /* ── Save edit ── */
  async function onEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.patch(`/users/${editUser._id}`, {
        name: editForm.name,
        role: editForm.role,
        managerId: editForm.managerId || null,
      });
      toast.success('User updated');
      setEditUser(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  /* ── Delete ── */
  async function onDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success(`${deleteTarget.name} has been removed`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users &amp; Roles</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Create employees and managers; assign reporting lines.
        </p>
      </div>

      {/* ───────── Invite user form ───────── */}
      <Card title="Invite user">
        <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              required
              type="email"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Temporary password</label>
            <input
              required
              minLength={8}
              type="password"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as 'employee' | 'manager',
                }))
              }
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reports to</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.managerId}
              onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
            >
              <option value="">— None —</option>
              {users
                .filter((u) => u.role === 'manager' || u.role === 'admin')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Create user
            </button>
          </div>
        </form>
      </Card>

      {/* ───────── Directory table ───────── */}
      <Card title="Directory">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 font-medium">Manager</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isMe = me?.id === u._id;
                return (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {/* Avatar circle */}
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shrink-0">
                          {u.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span>{u.name}</span>
                        {isMe && (
                          <span className="text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-1.5 py-0.5 rounded-full font-semibold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          roleBadgeClasses[u.role] || ''
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                      {u.managerId
                        ? users.find((x) => x._id === u.managerId)?.name || '—'
                        : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit user"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 transition-colors"
                        >
                          <PencilIcon />
                          Edit
                        </button>

                        {/* Delete button – hidden for self */}
                        {!isMe && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/40 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No users yet. Invite your first team member above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────── Edit Modal ───────── */}
      <AnimatePresence>
        {editUser && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit User
                </h2>
                <button
                  onClick={() => setEditUser(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={onEditSave} className="px-6 py-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    disabled
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                    value={editUser.email}
                  />
                  <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Role
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        role: e.target.value as 'employee' | 'manager' | 'admin',
                      }))
                    }
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Reports to
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    value={editForm.managerId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, managerId: e.target.value }))
                    }
                  >
                    <option value="">— None —</option>
                    {users
                      .filter(
                        (u) =>
                          (u.role === 'manager' || u.role === 'admin') &&
                          u._id !== editUser._id
                      )
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Modal actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── Delete Confirmation Modal ───────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                {/* Warning icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 text-red-600 dark:text-red-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Delete User
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Are you sure you want to delete
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {deleteTarget.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                  ({deleteTarget.email}) · This action cannot be undone.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    disabled={deleting}
                    onClick={() => setDeleteTarget(null)}
                    className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleting}
                    onClick={onDelete}
                    className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
