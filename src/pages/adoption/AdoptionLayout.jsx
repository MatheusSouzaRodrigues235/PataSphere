import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter, AdoptionHeader } from './AdoptionNavigation';
import '@/styles/_adoption.scss';

const favoritesKey = 'patasphere:adoption-favorites';

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoritesKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function AdoptionLayout() {
  const [favorites, setFavorites] = useState(readFavorites);
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
  }, [favorites]);

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id)
      ? current.filter((favorite) => favorite !== id)
      : [...current, id]);
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AdoptionHeader />
      <main id="conteudo"><Outlet context={{ favorites, toggleFavorite }} /></main>
      <AdoptionFooter />
    </>
  );
}
