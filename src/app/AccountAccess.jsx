import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readDemoRole } from './demoSession';
import { useAccountSession } from './accountSession';

export default function AccountAccess({ role }) {
  const account = useAccountSession();
  const { pathname, search } = useLocation();
  const currentRole = account?.role ?? readDemoRole();
  return currentRole === role
    ? <Outlet key={account?.id ?? 'demo'} />
    : <Navigate to="/login" state={{ returnTo: pathname + search }} replace />;
}
