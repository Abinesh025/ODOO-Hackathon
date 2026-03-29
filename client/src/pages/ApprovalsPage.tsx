import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';
import type { ExpenseRow } from './ExpensesPage';

export default function ApprovalsPage() {
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/expenses/pending')
      .then((r) => setItems(r.data.expenses))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      await api.post(`/expenses/${id}/act`, {
        action,
        comment: comments[id] || '',
      });
      toast.success(action === 'approve' ? 'Approved' : 'Rejected');
      setComments((c) => ({ ...c, [id]: '' }));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approvals</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Only expenses waiting on you appear here.
        </p>
      </div>
      <div className="space-y-4">
        {items.map((e, i) => (
          <motion.div
            key={e._id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(e.expenseDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {e.amount.toLocaleString()} {e.currency}
                    {e.convertedAmount != null && (
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        {' '}
                        (~ {e.convertedAmount.toLocaleString()} {e.companyCurrency})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {e.submittedBy &&
                    typeof e.submittedBy === 'object' &&
                    'name' in e.submittedBy
                      ? `${(e.submittedBy as { name?: string }).name} · `
                      : ''}
                    {e.category}
                  </p>
                  {e.description && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{e.description}</p>
                  )}
                </div>
                <div className="w-full max-w-md space-y-2">
                  <textarea
                    placeholder="Comment (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={comments[e._id] || ''}
                    onChange={(ev) =>
                      setComments((c) => ({ ...c, [e._id]: ev.target.value }))
                    }
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => act(e._id, 'approve')}
                      className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act(e._id, 'reject')}
                      className="flex-1 rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400">Nothing pending for you.</p>
        )}
      </div>
    </div>
  );
}
