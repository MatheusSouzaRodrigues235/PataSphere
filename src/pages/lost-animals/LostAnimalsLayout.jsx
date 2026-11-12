import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter, AdoptionHeader } from '@/pages/adoption/AdoptionNavigation';
import { exampleAlerts } from './lostAnimalsData';
import '@/styles/_adoption.scss';
import '@/styles/_lost-animals.scss';

export default function LostAnimalsLayout() {
  const [alerts, setAlerts] = useState(exampleAlerts);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function addAlert(alert) {
    setAlerts((current) => [alert, ...current]);
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AdoptionHeader />
      <main id="conteudo"><Outlet context={{ alerts, addAlert }} /></main>
      <AdoptionFooter />
    </>
  );
}
