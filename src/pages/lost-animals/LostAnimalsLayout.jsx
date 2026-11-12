import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter } from '@/pages/adoption/AdoptionNavigation';
import SiteHeader from '@/components/layout/SiteHeader';
import { exampleAlerts } from './lostAnimalsData';
import { readTutorAlerts, saveTutorData } from '@/pages/tutor/tutorStorage';
import '@/styles/_adoption.scss';
import '@/styles/_lost-animals.scss';

export default function LostAnimalsLayout() {
  const [tutorAlerts, setTutorAlerts] = useState(readTutorAlerts);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function addAlert(alert) {
    const next = [alert, ...readTutorAlerts()];
    saveTutorData({ alerts: next });
    setTutorAlerts(next);
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo"><Outlet context={{ alerts: [...tutorAlerts, ...exampleAlerts], addAlert }} /></main>
      <AdoptionFooter />
    </>
  );
}
