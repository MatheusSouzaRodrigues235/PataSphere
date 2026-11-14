import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiGrid, FiLock, FiUser } from 'react-icons/fi';
import { endAccountSession } from './accountSession';
import { clearDemoRole } from './demoSession';

export default function AccessDenied({ role, currentRole, account, returnTo }) {
  const navigate = useNavigate();
  const title = useRef(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const dashboard = currentRole === 'ong' ? '/dashboard/ong' : '/perfil/tutor';

  useEffect(() => {
    title.current.focus();
  }, [returnTo]);

  async function switchAccount() {
    setError('');
    setPending(true);
    try {
      if (account && !(await endAccountSession()).ok) throw new Error('Falha ao sair');
      clearDemoRole();
      await navigate('/login', { state: { returnTo }, replace: true });
    } catch {
      setError('Não foi possível sair da conta. Tente novamente.');
      setPending(false);
    }
  }

  return (
    <section className="access-denied" aria-labelledby="access-denied-title">
      <aside className="access-denied-sidebar">
        <strong>{account?.name || (currentRole === 'ong' ? 'Conta de ONG' : 'Conta de tutor')}</strong>
        <nav aria-label="Minha conta">
          <Link to={dashboard}><FiGrid aria-hidden="true" /> Meu painel</Link>
          {currentRole === 'ong' && (
            <Link to="/perfil/ong"><FiUser aria-hidden="true" /> Perfil da ONG</Link>
          )}
        </nav>
      </aside>
      <div className="access-denied-workspace">
        <div className="access-denied-breadcrumb">
          Minha conta <span aria-hidden="true">/</span> <strong>Acesso negado</strong>
        </div>
        <div className="access-denied-content">
          <span className="access-denied-lock"><FiLock aria-hidden="true" /></span>
          <h1 id="access-denied-title" ref={title} tabIndex={-1}>Você não tem acesso a esta página</h1>
          <p>
            Esta página é exclusiva para {role === 'ong' ? 'contas de ONG' : 'contas de tutor'}.
            {' '}Entre com uma conta autorizada para continuar.
          </p>
          <div className="access-denied-actions">
            <Link className="btn btn-primary rounded-pill" to={dashboard}>Voltar ao painel</Link>
            <button className="btn btn-light rounded-pill" type="button" onClick={switchAccount} disabled={pending}>
              {pending ? 'Saindo…' : 'Trocar de conta'}
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}
