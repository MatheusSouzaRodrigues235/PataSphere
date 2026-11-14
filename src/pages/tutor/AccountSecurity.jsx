import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';
import { manageAccount } from '@/app/accountSession';
import { clearDemoRole } from '@/app/demoSession';

export function AccountSecurity({ account }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const { currentPassword, password, confirmation } = Object.fromEntries(new FormData(event.currentTarget));
    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setPending(true);
    setError('');
    try {
      await manageAccount('senha', { currentPassword, password });
      clearDemoRole();
      await navigate('/login', { replace: true, state: { accountMessage: 'Senha alterada. Entre com sua nova senha.' } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  if (!account) return <p>Para alterar a senha, <Link to="/login">entre na sua conta</Link>.</p>;

  return (
    <form className="tutor-body" onSubmit={submit}>
      <fieldset disabled={pending}>
        <legend>Alterar senha</legend>
        <div className="tutor-field">
          <label htmlFor="current-password">Senha atual</label>
          <AuthPasswordInput id="current-password" name="currentPassword" autoComplete="current-password" required />
        </div>
        <div className="tutor-columns">
          <div className="tutor-field">
            <label htmlFor="new-password">Nova senha</label>
            <AuthPasswordInput id="new-password" name="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="tutor-field">
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <AuthPasswordInput id="confirm-password" name="confirmation" autoComplete="new-password" minLength={8} required />
          </div>
        </div>
        <p>Use pelo menos 8 caracteres com letras e números. Todas as sessões serão encerradas após a alteração.</p>
        <Button type="submit">{pending ? 'Salvando…' : 'Alterar senha'}</Button>
      </fieldset>
      {error && <p className="tutor-error" role="alert">{error}</p>}
    </form>
  );
}

export function CloseAccount({ role, close }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      await manageAccount('encerrar-conta', { password: fields.get('password'), confirmed: fields.has('confirmed') });
      clearDemoRole();
      await navigate('/login', { replace: true, state: { accountMessage: 'Sua conta foi encerrada.' } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal show centered onHide={pending ? undefined : close} aria-labelledby="close-account-title">
      <form onSubmit={submit}>
        <Modal.Header closeButton={!pending} closeLabel="Fechar">
          <Modal.Title id="close-account-title">Encerrar conta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{role === 'ong'
            ? 'O perfil da ONG, os anúncios, as solicitações recebidas e o histórico de doações serão excluídos permanentemente.'
            : 'Seu perfil, seus anúncios e suas solicitações de adoção serão excluídos permanentemente.'}</p>
          <fieldset disabled={pending}>
            <div className="tutor-field">
              <label htmlFor="close-account-password">Senha atual</label>
              <AuthPasswordInput id="close-account-password" name="password" autoComplete="current-password" required />
            </div>
            <label className="mt-3">
              <input className="form-check-input me-2" name="confirmed" type="checkbox" required />
              Confirmo que quero encerrar minha conta.
            </label>
          </fieldset>
          {error && <p className="tutor-error mt-2" role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={close} disabled={pending}>Cancelar</Button>
          <Button type="submit" variant="danger" disabled={pending}>{pending ? 'Encerrando…' : 'Encerrar conta'}</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
