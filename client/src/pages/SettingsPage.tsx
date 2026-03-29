import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import api from '../api/client';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [isManagerApproverFirst, setIsManagerApproverFirst] = useState(true);

  useEffect(() => {
    api
      .get('/company')
      .then((r) => {
        const c = r.data.company;
        setName(c.name);
        setDefaultCurrency(c.defaultCurrency);
        setIsManagerApproverFirst(!!c.isManagerApproverFirst);
      })
      .catch(() => toast.error('Failed to load company'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.patch('/company', {
        name,
        defaultCurrency,
        isManagerApproverFirst,
      });
      toast.success('Company updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Default reporting currency and manager-first routing.
        </p>
      </div>
      <Card title="Organization">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Company name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Default currency (ISO)</label>
            <input
              maxLength={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 uppercase dark:border-slate-700 dark:bg-slate-950"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isManagerApproverFirst}
              onChange={(e) => setIsManagerApproverFirst(e.target.checked)}
            />
            Require manager in chain when not already included (isManagerApproverFirst)
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Save
          </button>
        </form>
      </Card>
    </div>
  );
}
