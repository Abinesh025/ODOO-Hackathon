import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';
import type { ExpenseRow } from './ExpensesPage';

export default function TeamPage() {
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/expenses/team')
      .then((r) => setItems(r.data.expenses))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team expenses</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Direct reports and your own submissions (company currency shown).
        </p>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Person</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Original</th>
                <th className="pb-3 pr-4 font-medium">In company currency</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="py-3 pr-4">{format(new Date(e.expenseDate), 'MMM d, yyyy')}</td>
                  <td className="py-3 pr-4">
                    {e.submittedBy?.name || e.submittedBy?.email || '—'}
                  </td>
                  <td className="py-3 pr-4">{e.category}</td>
                  <td className="py-3 pr-4">
                    {e.amount.toLocaleString()} {e.currency}
                  </td>
                  <td className="py-3 pr-4">
                    {e.convertedAmount != null
                      ? `${e.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${e.companyCurrency}`
                      : '—'}
                  </td>
                  <td className="py-3 capitalize">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">No team activity yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
