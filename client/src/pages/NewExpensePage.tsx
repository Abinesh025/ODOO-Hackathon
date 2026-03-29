import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import api from '../api/client';

const CATS = ['Food', 'Travel', 'Lodging', 'Office', 'Software', 'Transport', 'Other'];

export default function NewExpensePage() {
  const nav = useNavigate();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [file, setFile] = useState<File | null>(null);
  const [ocr, setOcr] = useState<Record<string, unknown> | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function runOcr() {
    if (!file) {
      toast.error('Choose a receipt image first');
      return;
    }
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/expenses/ocr-preview', fd);
      setOcr(data.ocr);
      const o = data.ocr;
      if (typeof o.amount === 'number') setAmount(String(o.amount));
      if (o.suggestedCategory && typeof o.suggestedCategory === 'string') {
        setCategory(o.suggestedCategory);
      }
      if (o.date && typeof o.date === 'string') {
        setExpenseDate(o.date.slice(0, 10));
      }
      if (o.merchantName && typeof o.merchantName === 'string') {
        setDescription((d) => d || String(o.merchantName));
      }
      toast.success('OCR preview ready — review fields');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'OCR failed');
    } finally {
      setOcrLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('amount', amount);
      fd.append('currency', currency.toUpperCase());
      fd.append('category', category);
      fd.append('description', description);
      fd.append('expenseDate', new Date(expenseDate).toISOString());
      if (ocr) fd.append('ocrExtracted', JSON.stringify(ocr));
      if (file) fd.append('receipt', file);
      await api.post('/expenses', fd);
      toast.success('Expense submitted');
      nav('/expenses');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New expense</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Upload a receipt, run OCR preview, then submit.
        </p>
      </div>
      <Card title="Receipt" subtitle="PNG or JPG, up to 8MB">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            type="button"
            onClick={runOcr}
            disabled={ocrLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            {ocrLoading ? 'Scanning…' : 'Run OCR preview'}
          </button>
        </div>
        {ocr && (
          <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100"
          >
            {JSON.stringify(ocr, null, 2)}
          </motion.pre>
        )}
      </Card>
      <Card title="Details">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Amount</label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <input
                required
                maxLength={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 uppercase dark:border-slate-700 dark:bg-slate-950"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit expense'}
          </button>
        </form>
      </Card>
    </div>
  );
}
