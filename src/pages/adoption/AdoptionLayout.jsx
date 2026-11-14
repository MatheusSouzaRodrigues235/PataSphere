import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter } from './AdoptionNavigation';
import { useTutorSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import '@/styles/_adoption.scss';

function readFavorites(favoritesKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(favoritesKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function AdoptionLayout() {
  const tutor = useTutorSession();
  return <Adoption key={tutor?.id ?? 'guest'} tutorId={tutor?.id} />;
}

function Adoption({ tutorId }) {
  const favoritesKey = tutorId ? 'patasphere:adoption-favorites:' + tutorId : 'patasphere:adoption-favorites';
  const [favorites, setFavorites] = useState(() => readFavorites(favoritesKey));
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch {
      // Favorites are still available during the current visit.
    }
  }, [favorites, favoritesKey]);

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id)
      ? current.filter((favorite) => favorite !== id)
      : [...current, id]);
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo"><Outlet context={{ favorites, toggleFavorite }} /></main>
      <AdoptionFooter />
    </>
  );
}
