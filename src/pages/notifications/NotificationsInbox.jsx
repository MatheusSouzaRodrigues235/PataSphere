import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAccountSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import { requestNotifications, useNotifications, useRefreshNotifications } from './notificationApi';
import '@/styles/_adoption.scss';

const receivedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function NotificationsInbox() {
  const account = useAccountSession();
  const { pathname, search } = useLocation();
  if (!account) return <Navigate to="/login" replace state={{ returnTo: pathname + search }} />;
  return <Inbox key={account.id} account={account} />;
}

function Inbox({ account }) {
  const [params, setParams] = useSearchParams();
  const page = Math.min(999999, Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1));
  const { data, isPending, isError, refetch } = useNotifications(account.id, '?pagina=' + page, page === 1);
  const refresh = useRefreshNotifications();
  const [marking, setMarking] = useState(null);
  const [writeError, setWriteError] = useState('');

  async function markRead(id) {
    setMarking(id);
    setWriteError('');
    try {
      await requestNotifications('/' + id + '/lida', { method: 'PATCH' });
      await refresh();
    } catch {
      setWriteError('Não foi possível marcar a notificação como lida. Tente novamente.');
    } finally {
      setMarking(null);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="adoption-container py-4">
        <h1>Notificações</h1>
        <Link to={'/perfil/' + account.role + '/notificacoes'}>Preferências de notificação</Link>
        {isPending && <p role="status">Carregando notificações…</p>}
        {isError && <p role="alert">Não foi possível carregar as notificações. <button type="button" className="adoption-control" onClick={refetch}>Tentar novamente</button></p>}
        {writeError && <p className="text-danger" role="alert">{writeError}</p>}
        {data && (data.notifications.length ? (
          <ul className="list-unstyled d-grid gap-3 mt-3">
            {data.notifications.map((item) => (
              <li key={item.id} className="card p-3">
                <h2 className="h5">{item.title}{!item.read && <span className="badge bg-danger ms-2">Nova</span>}</h2>
                <p className="text-break">{item.message}</p>
                <p><time dateTime={item.createdAt}>{receivedAt.format(new Date(item.createdAt))}</time></p>
                <div className="d-flex gap-2">
                  {item.destination && <Link className="adoption-control" to={item.destination}>Ver detalhes</Link>}
                  {!item.read && <button type="button" className="adoption-control" disabled={marking !== null} onClick={() => markRead(item.id)}>
                    {marking === item.id ? 'Salvando…' : 'Marcar como lida'}
                  </button>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3">Nenhuma notificação nesta página.</p>)}
        {(page > 1 || data?.hasNext) && <nav aria-label="Paginação de notificações" className="d-flex gap-2">
          {page > 1 && <button type="button" className="adoption-control" onClick={() => setParams({ pagina: page - 1 })}>Anterior</button>}
          {data?.hasNext && <button type="button" className="adoption-control" onClick={() => setParams({ pagina: page + 1 })}>Próxima</button>}
        </nav>}
      </main>
    </>
  );
}
