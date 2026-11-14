import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAccountSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import { requestLostAnimals, useLostAnimals } from './lostAnimalsApi';
import { useRefreshNotifications } from '@/pages/notifications/notificationApi';
import { lostAnimalsPath } from './lostAnimalsData';
import '@/styles/_adoption.scss';

const receivedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function SightingsInbox() {
  const account = useAccountSession();
  const { pathname, search } = useLocation();
  if (!account) return <Navigate to="/login" replace state={{ returnTo: pathname + search }} />;
  return <Inbox key={account.id} />;
}

function Inbox() {
  const [params, setParams] = useSearchParams();
  const before = params.get('antes');
  const path = '/avistamentos' + (before ? '?' + new URLSearchParams({ antes: before }) : '');
  const { data, loading, error, reload } = useLostAnimals(path, { live: !before });
  const refreshNotifications = useRefreshNotifications();
  const [marking, setMarking] = useState(null);
  const [read, setRead] = useState({});
  const [writeError, setWriteError] = useState('');

  async function markRead(id) {
    if (marking) return;
    setMarking(id);
    setWriteError('');
    try {
      await requestLostAnimals('/avistamentos/' + id + '/lido', { method: 'PATCH' });
      setRead((previous) => ({ ...previous, [id]: true }));
      void refreshNotifications();
    } catch (requestError) {
      setWriteError(requestError.message);
    } finally {
      setMarking(null);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="adoption-container py-4">
        <h1>Avistamentos recebidos</h1>
        {loading && <p role="status">Carregando avistamentos…</p>}
        {error && <p role="alert">{error} <button type="button" className="adoption-control" onClick={reload}>Tentar novamente</button></p>}
        {writeError && <p className="text-danger" role="alert">{writeError}</p>}
        {data && (data.sightings.length ? (
          <ul className="list-unstyled d-grid gap-3">
            {data.sightings.map((sighting) => (
              <li key={sighting.id} className="card p-3">
                <h2 className="h5"><Link to={lostAnimalsPath + '/' + sighting.alertId}>{sighting.animalName}</Link></h2>
                <p className="mb-2"><time dateTime={sighting.createdAt}>{receivedAt.format(new Date(sighting.createdAt))}</time>
                  {!sighting.read && !read[sighting.id] && <strong className="ms-2">Novo</strong>}
                </p>
                <p className="mb-2"><strong>Local do avistamento</strong> {sighting.place}</p>
                <p><strong>Enviado por</strong> {sighting.name} · <a href={'https://wa.me/55' + sighting.phone}
                  target="_blank" rel="noreferrer" aria-label={'Conversar com ' + sighting.name + ' pelo WhatsApp'}>{sighting.phone}</a></p>
                {!sighting.read && !read[sighting.id] && <div>
                  <button type="button" className="adoption-control" disabled={Boolean(marking)} onClick={() => markRead(sighting.id)}>
                    {marking === sighting.id ? 'Salvando…' : 'Marcar como lido'}
                  </button>
                </div>}
              </li>
            ))}
          </ul>
        ) : <p>Nenhum avistamento recebido nesta página.</p>)}
        {(before || data?.next) && <nav aria-label="Paginação de avistamentos" className="d-flex gap-2">
          {before && <button type="button" className="adoption-control" onClick={() => setParams({})}>Mais recentes</button>}
          {data?.next && <button type="button" className="adoption-control" onClick={() => setParams({ antes: data.next })}>Mais antigos</button>}
        </nav>}
      </main>
    </>
  );
}
