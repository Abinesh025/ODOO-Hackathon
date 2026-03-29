import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth, type Role } from './context/AuthContext';
import { Layout } from './components/Layout';
import { NotificationListener } from './components/NotificationListener';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import NewExpensePage from './pages/NewExpensePage';
import ApprovalsPage from './pages/ApprovalsPage';
import TeamPage from './pages/TeamPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminExpensesPage from './pages/AdminExpensesPage';
import WorkflowPage from './pages/WorkflowPage';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';
import { Skeleton } from './components/ui/Skeleton';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-32 w-full max-w-lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <NotificationListener />
      <Outlet />
    </>
  );
}

function RoleGate({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/new" element={<NewExpensePage />} />
          <Route
            path="approvals"
            element={
              <RoleGate roles={['admin', 'manager']}>
                <ApprovalsPage />
              </RoleGate>
            }
          />
          <Route
            path="team"
            element={
              <RoleGate roles={['manager']}>
                <TeamPage />
              </RoleGate>
            }
          />
          <Route
            path="admin/users"
            element={
              <RoleGate roles={['admin']}>
                <AdminUsersPage />
              </RoleGate>
            }
          />
          <Route
            path="admin/expenses"
            element={
              <RoleGate roles={['admin']}>
                <AdminExpensesPage />
              </RoleGate>
            }
          />
          <Route
            path="admin/workflow"
            element={
              <RoleGate roles={['admin']}>
                <WorkflowPage />
              </RoleGate>
            }
          />
          <Route
            path="admin/rules"
            element={
              <RoleGate roles={['admin']}>
                <RulesPage />
              </RoleGate>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGate roles={['admin']}>
                <SettingsPage />
              </RoleGate>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
