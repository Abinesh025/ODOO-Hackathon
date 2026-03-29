import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type Stats = {
  pendingMine: number;
  pendingApprovals: number;
  totalSpendApproved: number;
  currency: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/expenses/dashboard')
      .then((r) => setStats(r.data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Hello, {user?.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track reimbursements and approvals in one place.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-start gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">My pending</p>
                <p className="text-2xl font-semibold">{stats?.pendingMine ?? 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>
        {user?.role !== 'employee' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Awaiting my action</p>
                  <p className="text-2xl font-semibold">{stats?.pendingApprovals ?? 0}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex items-start gap-3">
              <Wallet className="h-8 w-8 text-brand-500" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approved spend (company)</p>
                <p className="text-2xl font-semibold">
                  {stats?.totalSpendApproved?.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  {stats?.currency}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
