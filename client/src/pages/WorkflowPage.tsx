import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import api from '../api/client';

type Step = {
  order: number;
  label: string;
  stepType: 'manager' | 'user';
  approverUserId?: string | null;
};

export default function WorkflowPage() {
  const [name, setName] = useState('Main flow');
  const [steps, setSteps] = useState<Step[]>([]);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([api.get('/approval-flow'), api.get('/users')])
      .then(([flowRes, usersRes]) => {
        const flow = flowRes.data.flow;
        if (flow) {
          setName(flow.name || 'Main flow');
          setSteps(flow.steps || []);
        }
        setUsers(usersRes.data.users);
      })
      .catch(() => toast.error('Failed to load workflow'));
  }, []);

  function addStep() {
    setSteps((s) => [
      ...s,
      {
        order: s.length + 1,
        label: `Step ${s.length + 1}`,
        stepType: 'manager',
        approverUserId: null,
      },
    ]);
  }

  async function save() {
    try {
      await api.put('/approval-flow', { name, steps });
      toast.success('Workflow saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approval workflow</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Sequential steps: use Manager for direct manager, or pick a specific user (Finance, Director).
        </p>
      </div>
      <Card title="Flow name">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Card>
      <Card title="Steps" subtitle="Processed in order. Duplicate approvers are deduplicated.">
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 md:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Label</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={step.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSteps((s) => s.map((x, i) => (i === idx ? { ...x, label: v } : x)));
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={step.stepType}
                  onChange={(e) => {
                    const stepType = e.target.value as 'manager' | 'user';
                    setSteps((s) =>
                      s.map((x, i) =>
                        i === idx ? { ...x, stepType, approverUserId: stepType === 'user' ? x.approverUserId : null } : x
                      )
                    );
                  }}
                >
                  <option value="manager">Manager (reports-to)</option>
                  <option value="user">Specific user</option>
                </select>
              </div>
              {step.stepType === 'user' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Approver</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={step.approverUserId || ''}
                    onChange={(e) => {
                      const approverUserId = e.target.value || null;
                      setSteps((s) =>
                        s.map((x, i) => (i === idx ? { ...x, approverUserId } : x))
                      );
                    }}
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
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => setSteps((s) => s.filter((_, i) => i !== idx))}
                >
                  Remove step
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            + Add step
          </button>
          <button
            type="button"
            onClick={save}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Save workflow
          </button>
        </div>
      </Card>
    </div>
  );
}
