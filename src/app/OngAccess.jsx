import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readDemoRole } from './demoSession';
import { useOngSession } from './ongSession';

export default function OngAccess() {
  const ong = useOngSession();
  const { pathname, search } = useLocation();
  return ong || readDemoRole() === 'ong'
    ? <Outlet key={ong?.id ?? 'demo'} />
    : <Navigate to="/login" state={{ returnTo: pathname + search }} replace />;
}
