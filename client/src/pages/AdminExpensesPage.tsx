import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';

type Row = {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  expenseDate: string;
  submittedBy?: { name?: string; email?: string };
};

export default function AdminExpensesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get('/expenses/all').then((r) => setItems(r.data.expenses));

  useEffect(() => {
    load()
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function override(id: string) {
    const comment = window.prompt('Override comment (optional)') || '';
    try {
      await api.post(`/expenses/${id}/override`, { comment });
      toast.success('Expense approved (override)');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All expenses</h1>
        <p className="text-slate-600 dark:text-slate-400">Admin view — override stuck approvals.</p>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Employee</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="py-3 pr-4">{format(new Date(e.expenseDate), 'MMM d, yyyy')}</td>
                  <td className="py-3 pr-4">{e.submittedBy?.name || e.submittedBy?.email}</td>
                  <td className="py-3 pr-4">
                    {e.amount.toLocaleString()} {e.currency}
                  </td>
                  <td className="py-3 pr-4 capitalize">{e.status}</td>
                  <td className="py-3">
                    {e.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => override(e._id)}
                        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        Override approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">No expenses.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
