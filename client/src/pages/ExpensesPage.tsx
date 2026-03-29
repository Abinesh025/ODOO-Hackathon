import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';

export type ExpenseRow = {
  _id: string;
  amount: number;
  currency: string;
  convertedAmount?: number;
  companyCurrency?: string;
  category: string;
  status: string;
  expenseDate: string;
  description?: string;
  submittedBy?: { name?: string; email?: string };
};

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

export default function ExpensesPage() {
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/expenses/me')
      .then((r) => setItems(r.data.expenses))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My expenses</h1>
          <p className="text-slate-600 dark:text-slate-400">History with approval status.</p>
        </div>
        <Link
          to="/expenses/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white shadow hover:bg-brand-700"
        >
          <Plus className="h-5 w-5" />
          New expense
        </Link>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Company</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e, i) => (
                <motion.tr
                  key={e._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 dark:border-slate-800/80"
                >
                  <td className="py-3 pr-4">
                    {format(new Date(e.expenseDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 pr-4">{e.category}</td>
                  <td className="py-3 pr-4">
                    {e.amount.toLocaleString()} {e.currency}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {e.convertedAmount != null
                      ? `${e.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${e.companyCurrency}`
                      : '—'}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[e.status] || 'bg-slate-100'}`}
                    >
                      {e.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">No expenses yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
