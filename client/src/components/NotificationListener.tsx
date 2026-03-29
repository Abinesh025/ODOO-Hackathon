import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

type Payload = {
  type?: string;
  status?: string;
  action?: string;
  approverName?: string;
  amount?: number;
  currency?: string;
  category?: string;
  description?: string;
  comment?: string;
  expenseId?: string;
};

export function NotificationListener() {
  const { socket, user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    const onCreated = (_p: Payload) => {
      toast('New expense submitted', { icon: '📩' });
    };

    const onUpdated = (p: Payload) => {
      const isMyExpense = !!p.approverName; // rich payload sent to submitter

      if (isMyExpense) {
        const amountStr = p.amount
          ? `${p.amount.toLocaleString()} ${p.currency || ''}`
          : '';
        const detail = p.category
          ? `${amountStr} ${p.category}`
          : amountStr;

        if (p.status === 'approved') {
          toast.success(
            `✅ Your expense ${detail ? `(${detail.trim()}) ` : ''}was approved by ${p.approverName}${p.comment ? `\nComment: "${p.comment}"` : ''}`,
            { duration: 6000 }
          );
        } else if (p.status === 'rejected') {
          toast.error(
            `❌ Your expense ${detail ? `(${detail.trim()}) ` : ''}was rejected by ${p.approverName}${p.comment ? `\nReason: "${p.comment}"` : ''}`,
            { duration: 8000 }
          );
        } else {
          toast(`Your expense was updated`, { icon: '📋' });
        }
      } else {
        // Company-wide broadcast (for dashboard refresh)
        const s = p.status;
        if (s === 'approved' || s === 'rejected') {
          toast(
            s === 'approved' ? 'An expense was approved' : 'An expense was rejected',
            { icon: s === 'approved' ? '✅' : '❌', duration: 3000 }
          );
        }
      }
    };

    const onEscalated = () => {
      toast('An expense was escalated', { icon: '⚠️' });
    };

    socket.on('expense_created', onCreated);
    socket.on('expense_updated', onUpdated);
    socket.on('expense_escalated', onEscalated);

    return () => {
      socket.off('expense_created', onCreated);
      socket.off('expense_updated', onUpdated);
      socket.off('expense_escalated', onEscalated);
    };
  }, [socket, user]);

  return null;
}
