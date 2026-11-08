import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import Home from '@/pages/home/Home';
import Login from '@/pages/login/Login';
import ChooseProfile from '@/pages/register/ChooseProfile';
import RegisterTutor from '@/pages/register/RegisterTutor';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/cadastro', element: <ChooseProfile /> },
  { path: '/cadastro/tutor', element: <RegisterTutor /> },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
