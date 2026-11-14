import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readDemoRole } from './demoSession';
import { useAccountSession } from './accountSession';
import AccessDenied from './AccessDenied';

export default function AccountAccess({ role }) {
  const account = useAccountSession();
  const { pathname, search } = useLocation();
  const currentRole = account?.role ?? readDemoRole();
  const returnTo = pathname + search;

  if (!currentRole) return <Navigate to="/login" state={{ returnTo }} replace />;
  if (currentRole !== role) {
    return <AccessDenied role={role} currentRole={currentRole} account={account} returnTo={returnTo} />;
  }
  return <Outlet key={account?.id ?? 'demo'} />;
}
