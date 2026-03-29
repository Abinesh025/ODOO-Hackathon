import { NavLink } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/expenses/new', label: 'New' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/team', label: 'Team' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/expenses', label: 'All' },
  { to: '/admin/workflow', label: 'Flow' },
  { to: '/admin/rules', label: 'Rules' },
  { to: '/settings', label: 'Company' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const role = user?.role;

  const visible = links.filter((l) => {
    if (l.to === '/approvals' && role === 'employee') return false;
    if (l.to === '/team' && role !== 'manager') return false;
    if (
      ['/admin/users', '/admin/expenses', '/admin/workflow', '/admin/rules', '/settings'].includes(
        l.to
      ) &&
      role !== 'admin'
    )
      return false;
    return true;
  });

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <span className="font-semibold text-slate-900 dark:text-white">ExpenseFlow</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          onClick={toggle}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          aria-label="Menu"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 bg-white p-4 shadow-xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {visible.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-lg px-3 py-3 text-sm font-medium',
                      isActive
                        ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50'
                        : 'text-slate-700 dark:text-slate-200'
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
