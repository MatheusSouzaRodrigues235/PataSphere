import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { AdoptionFooter } from './AdoptionNavigation';
import { requestAdoption } from './adoptionApi';
import { useTutorSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import '@/styles/_adoption.scss';

const guestKey = 'patasphere:adoption-favorites';
const favoritesEndpoint = '/favoritos';

function readFavorites(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? [...new Set(saved.filter((id) =>
      typeof id === 'string' && /^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9_223_372_036_854_775_807n,
    ))] : [];
  } catch {
    return [];
  }
}

export default function AdoptionLayout() {
  const tutor = useTutorSession();
  return <Adoption key={tutor?.id ?? 'guest'} tutorId={tutor?.id} />;
}

function Adoption({ tutorId }) {
  const queryClient = useQueryClient();
  const queryKey = ['adoption-favorites', tutorId];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => requestAdoption(favoritesEndpoint, { signal }),
    enabled: Boolean(tutorId),
    refetchInterval: 15_000,
  });
  const [localFavorites, setLocalFavorites] = useState(() => tutorId ? [] : readFavorites(guestKey));
  const [legacy, setLegacy] = useState(() => tutorId ? [guestKey, guestKey + ':' + tutorId]
    .map((key) => ({ key, ids: readFavorites(key) })) : []);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const favorites = tutorId ? query.data?.favorites ?? [] : localFavorites;
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (tutorId) return;
    function syncLocal(event) {
      if (event.key === guestKey || event.key === null) setLocalFavorites(readFavorites(guestKey));
    }
    window.addEventListener('storage', syncLocal);
    return () => window.removeEventListener('storage', syncLocal);
  }, [tutorId]);

  async function save(action) {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      await queryClient.cancelQueries({ queryKey });
      await action();
    } catch (error) {
      setFeedback({ error: true, message: error.message });
    } finally {
      await queryClient.invalidateQueries({ queryKey });
      pending.current = false;
      setSaving(false);
    }
  }

  function toggleFavorite(id) {
    const removing = favorites.includes(id);
    if (!tutorId) {
      const next = removing ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
      setLocalFavorites(next);
      try {
        localStorage.setItem(guestKey, JSON.stringify(next));
      } catch {
        setFeedback({ error: true, message: 'O navegador não conseguiu guardar os favoritos para outras visitas.' });
      }
      return;
    }
    if (query.isPending || query.isError) return;
    void save(() => requestAdoption(favoritesEndpoint + '/' + id, { method: removing ? 'DELETE' : 'PUT' }));
  }

  function importFavorites() {
    void save(async () => {
      const ids = [...new Set(legacy.flatMap((entry) => entry.ids))];
      const imported = new Set();
      for (let start = 0; start < ids.length; start += 500) {
        const result = await requestAdoption(favoritesEndpoint + '/importar', {
          method: 'POST', body: { ids: ids.slice(start, start + 500) },
        });
        result.favorites.forEach((id) => imported.add(id));
      }

      try {
        for (const entry of legacy) {
          const remaining = readFavorites(entry.key).filter((id) => !entry.ids.includes(id));
          if (remaining.length) localStorage.setItem(entry.key, JSON.stringify(remaining));
          else localStorage.removeItem(entry.key);
        }
      } catch {
        setFeedback({ message: 'Favoritos sincronizados. A lista antiga continua disponível neste navegador.' });
        setLegacy([]);
        return;
      }
      setLegacy([]);
      setFeedback({ message: imported.size === ids.length
        ? 'Favoritos deste navegador sincronizados com a sua conta.'
        : 'Favoritos disponíveis sincronizados. Alguns animais da lista antiga já saíram do mural.' });
    });
  }

  const favoritesDisabled = Boolean(tutorId) && (saving || query.isPending || query.isError);
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo">
        {(feedback || legacy.some(({ ids }) => ids.length) || (tutorId && query.isError)) &&
          <div className="adoption-container pt-3">
            {legacy.some(({ ids }) => ids.length) && <button type="button" className="adoption-control"
              disabled={favoritesDisabled} onClick={importFavorites}>Importar favoritos deste navegador</button>}
            {tutorId && query.isError && <p role="alert">Não foi possível carregar os favoritos. <button
              type="button" className="adoption-control" onClick={() => query.refetch()}>Tentar novamente</button></p>}
            {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
          </div>}
        <Outlet context={{ favorites, toggleFavorite, favoritesDisabled }} />
      </main>
      <AdoptionFooter />
    </>
  );
}
