import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  CheckSquare,
  Users,
  GitBranch,
  Scale,
  Building2,
  LogOut,
  Moon,
  Sun,
  ListTree,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { to: '/expenses', label: 'My expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
  { to: '/expenses/new', label: 'New expense', icon: PlusCircle, roles: ['admin', 'manager', 'employee'] },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'manager'] },
  { to: '/team', label: 'Team', icon: Users, roles: ['manager'] },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/admin/expenses', label: 'All expenses', icon: ListTree, roles: ['admin'] },
  { to: '/admin/workflow', label: 'Workflow', icon: GitBranch, roles: ['admin'] },
  { to: '/admin/rules', label: 'Rules', icon: Scale, roles: ['admin'] },
  { to: '/settings', label: 'Company', icon: Building2, roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const role = user?.role;

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:flex"
    >
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          ODOO Smart 
        </p>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Reimbursements</h1>
        {user && (
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {user.name} · <span className="capitalize">{user.role}</span>
          </p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links
          .filter((l) => role && l.roles.includes(role))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                )
              }
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </NavLink>
          ))}
      </nav>
      <div className="mt-auto space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </motion.aside>
  );
}
