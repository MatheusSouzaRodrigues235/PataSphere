import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter } from '@/pages/adoption/AdoptionNavigation';
import { useTutorSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import { exampleAlerts } from './lostAnimalsData';
import { readTutorAlerts, saveTutorData } from '@/pages/tutor/tutorStorage';
import '@/styles/_adoption.scss';
import '@/styles/_lost-animals.scss';

export default function LostAnimalsLayout() {
  const tutor = useTutorSession();
  return <LostAnimals key={tutor?.id ?? 'guest'} tutorId={tutor?.id} />;
}

function LostAnimals({ tutorId }) {
  const [tutorAlerts, setTutorAlerts] = useState(() => readTutorAlerts(tutorId));
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function addAlert(alert) {
    const next = [alert, ...readTutorAlerts(tutorId)];
    saveTutorData({ alerts: next }, tutorId);
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
