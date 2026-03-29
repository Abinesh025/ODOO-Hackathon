import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import api from '../api/client';

type Rule = {
  _id: string;
  name: string;
  isActive: boolean;
  ruleType: string;
  percentageThreshold?: number | null;
  specificApproverId?: string | null;
  hybridOperator?: string;
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    ruleType: 'percentage' as Rule['ruleType'],
    percentageThreshold: 60,
    specificApproverId: '',
    hybridOperator: 'or' as 'or' | 'and',
  });

  const load = () =>
    Promise.all([api.get('/rules'), api.get('/users')]).then(([r, u]) => {
      setRules(r.data.rules);
      setUsers(u.data.users);
    });

  useEffect(() => {
    load().catch(() => toast.error('Failed to load rules'));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/rules', {
        name: form.name,
        ruleType: form.ruleType,
        percentageThreshold:
          form.ruleType === 'percentage' || form.ruleType === 'hybrid'
            ? form.percentageThreshold
            : null,
        specificApproverId:
          form.ruleType === 'specific_approver' || form.ruleType === 'hybrid'
            ? form.specificApproverId || null
            : null,
        hybridOperator: form.ruleType === 'hybrid' ? form.hybridOperator : undefined,
      });
      toast.success('Rule created');
      setForm({
        name: '',
        ruleType: 'percentage',
        percentageThreshold: 60,
        specificApproverId: '',
        hybridOperator: 'or',
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Conditional rules</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Percentage thresholds, designated approvers (e.g. CFO), or hybrid OR/AND — evaluated on each approval.
        </p>
      </div>
      <Card title="New rule">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.ruleType}
              onChange={(e) =>
                setForm((f) => ({ ...f, ruleType: e.target.value as Rule['ruleType'] }))
              }
            >
              <option value="percentage">Percentage (e.g. 60% approvals)</option>
              <option value="specific_approver">Specific approver (e.g. CFO signs off)</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          {(form.ruleType === 'percentage' || form.ruleType === 'hybrid') && (
            <div>
              <label className="mb-1 block text-sm font-medium">Threshold %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={form.percentageThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, percentageThreshold: Number(e.target.value) }))
                }
              />
            </div>
          )}
          {(form.ruleType === 'specific_approver' || form.ruleType === 'hybrid') && (
            <div>
              <label className="mb-1 block text-sm font-medium">Designated approver</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={form.specificApproverId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specificApproverId: e.target.value }))
                }
              >
                <option value="">Select…</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.ruleType === 'hybrid' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Hybrid operator</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={form.hybridOperator}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hybridOperator: e.target.value as 'or' | 'and',
                  }))
                }
              >
                <option value="or">OR — % met OR designated approver acts</option>
                <option value="and">AND — both % and designated approver</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700"
          >
            Create rule
          </button>
        </form>
      </Card>
      <Card title="Active rules">
        <ul className="space-y-3">
          {rules.map((r) => (
            <li
              key={r._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.ruleType}
                  {r.percentageThreshold != null && ` · ${r.percentageThreshold}%`}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={async () => {
                  await api.delete(`/rules/${r._id}`);
                  toast.success('Removed');
                  load();
                }}
              >
                Delete
              </button>
            </li>
          ))}
          {rules.length === 0 && <p className="text-slate-500 dark:text-slate-400">No rules yet.</p>}
        </ul>
      </Card>
    </div>
  );
}
