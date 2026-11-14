import { createBrowserRouter } from 'react-router-dom';
import AccountAccess from './AccountAccess';
import { profileLoader } from './profileApi';
import { loadAccountSession } from './accountSession';
import PublicLayout from '@/layouts/PublicLayout';
import Home from '@/pages/home/Home';
import AdoptionBoard from '@/pages/adoption/AdoptionBoard';
import AdoptionAnimalPage from '@/pages/adoption/AdoptionAnimalPage';
import AdoptionLayout from '@/pages/adoption/AdoptionLayout';
import LostAnimalsLayout from '@/pages/lost-animals/LostAnimalsLayout';
import LostAnimalsBoard from '@/pages/lost-animals/LostAnimalsBoard';
import LostAnimalForm from '@/pages/lost-animals/LostAnimalForm';
import SightingsInbox from '@/pages/lost-animals/SightingsInbox';
import { sightingsInboxPath } from '@/pages/lost-animals/lostAnimalsApi';
import LostAnimalPage from '@/pages/lost-animals/LostAnimalPage';
import Login from '@/pages/login/Login';
import ChooseProfile from '@/pages/register/ChooseProfile';
import RegisterTutor from '@/pages/register/RegisterTutor';
import RegisterOng from '@/pages/register/RegisterOng';
import OngDashboard from '@/pages/dashboard/OngDashboard';
import { OngProfile, OngProfilePreview, OngPublicLayout } from '@/pages/ongs/OngPublic';
import OngSettings from '@/pages/ong-settings/OngSettings';
import OngDirectory from '@/pages/ongs/OngDirectory';
import TutorProfile from '@/pages/tutor/TutorProfile';
import NotFound from '@/pages/NotFound';

const routes = [
  {
    path: '/ongs',
    element: <OngPublicLayout />,
    children: [
      { index: true, element: <OngDirectory /> },
      { element: <AccountAccess role="ong" />, children: [
        { path: 'previa', element: <OngProfilePreview /> },
        { path: 'amor-de-pet/previa', element: <OngProfilePreview /> },
      ] },
      { path: ':ongSlug', element: <OngProfile /> },
    ],
  },
  {
    element: <AccountAccess role="ong" />,
    children: [
      {
        path: '/dashboard/ong',
        element: <OngDashboard />,
        children: [
          { path: 'doacoes', element: null },
          { path: 'animais', element: null },
          { path: 'animais-perdidos', element: null },
        ],
      },
      { path: '/perfil/ong/:secao?', element: <OngSettings />, loader: profileLoader('ong') },
    ],
  },
  {
    path: '/adocao',
    element: <AdoptionLayout />,
    children: [
      { index: true, element: <AdoptionBoard /> },
      { path: ':animalId', element: <AdoptionAnimalPage /> },
    ],
  },
  {
    path: '/animais-perdidos',
    element: <LostAnimalsLayout />,
    children: [
      { index: true, element: <LostAnimalsBoard /> },
      { path: 'cadastro', element: <LostAnimalForm /> },
      { path: ':animalId', element: <LostAnimalPage /> },
    ],
  },
  { element: <AccountAccess role="tutor" />, children: [{ path: '/perfil/tutor/:secao?', element: <TutorProfile />, loader: profileLoader('tutor') }] },
  { path: sightingsInboxPath, element: <SightingsInbox /> },
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
];

export const router = createBrowserRouter([{
  id: 'account-session',
  loader: loadAccountSession,
  hydrateFallbackElement: <p role="status">Carregando…</p>,
  shouldRevalidate: () => true,
  children: routes,
}]);
