import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import Home from '@/pages/home/Home';
import AdoptionBoard from '@/pages/adoption/AdoptionBoard';
import AdoptionLayout from '@/pages/adoption/AdoptionLayout';
import Login from '@/pages/login/Login';
import ChooseProfile from '@/pages/register/ChooseProfile';
import RegisterTutor from '@/pages/register/RegisterTutor';
import RegisterOng from '@/pages/register/RegisterOng';
import OngDashboard from '@/pages/dashboard/OngDashboard';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/dashboard/ong',
    element: <OngDashboard />,
    children: [
      { path: 'doacoes', element: null },
      { path: 'animais', element: null },
      { path: 'animais-perdidos', element: null },
    ],
  },
  { path: '/adocao', element: <AdoptionLayout />, children: [{ index: true, element: <AdoptionBoard /> }] },
  { path: '/login', element: <Login /> },
  { path: '/cadastro', element: <ChooseProfile /> },
  { path: '/cadastro/tutor', element: <RegisterTutor /> },
  { path: '/cadastro/ong', element: <RegisterOng /> },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
