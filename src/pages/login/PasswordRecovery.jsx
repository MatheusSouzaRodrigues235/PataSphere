import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { manageAccount } from '@/app/accountSession';
import { clearDemoRole } from '@/app/demoSession';
import AuthLayout from '@/layouts/AuthLayout';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';

export default function PasswordRecovery({ reset = false }) {
  const navigate = useNavigate();
  const [token] = useState(() => window.location.hash.slice(1));
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const title = reset ? 'Redefinir senha' : 'Recuperar senha';
  const validLink = !reset || /^[a-f0-9]{64}$/.test(token);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (reset && fields.password !== fields.confirmPassword) {
      setFeedback({ error: true, message: 'As senhas precisam ser iguais.' });
      return;
    }

    setPending(true);
    setFeedback(null);
    try {
      if (reset) {
        await manageAccount('redefinir-senha', { token, password: fields.password });
        clearDemoRole();
        await navigate('/login', { replace: true, state: { accountMessage: 'Senha redefinida. Entre com sua nova senha.' } });
      } else {
        const result = await manageAccount('recuperar-senha', { email: fields.email });
        setFeedback({ message: result.message });
      }
    } catch (error) {
      setFeedback({ error: true, message: error.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title={title} intro="Acesso à sua conta" description="Recuperação de acesso para tutores e ONGs." benefits={[]}>
      <div className="login-content">
        <h1 id="auth-title">{title}</h1>
        {validLink ? (
          <form className="login-form" onSubmit={submit}>
            {reset ? <>
              <div className="auth-field">
                <label htmlFor="reset-password">Nova senha</label>
                <AuthPasswordInput id="reset-password" name="password" autoComplete="new-password" minLength={8} required />
                <small>Use pelo menos 8 caracteres com letras e números.</small>
              </div>
              <div className="auth-field">
                <label htmlFor="reset-confirm">Confirmar nova senha</label>
                <AuthPasswordInput id="reset-confirm" name="confirmPassword" autoComplete="new-password" minLength={8} required />
              </div>
            </> : (
              <div className="auth-field">
                <label htmlFor="recovery-email">E-mail do cadastro</label>
                <input className="form-control" id="recovery-email" name="email" type="email" autoComplete="username" required />
              </div>
            )}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? 'Aguarde…' : reset ? 'Salvar nova senha' : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : <p role="alert">Link inválido. Solicite um novo link de recuperação.</p>}
        {feedback && <p className="auth-feedback" role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
        {reset && <p><Link className="auth-action" to="/recuperar-senha" replace>Solicitar outro link</Link></p>}
        <p className="auth-switch"><Link to="/login" className="auth-action" replace>Voltar para o login</Link></p>
      </div>
    </AuthLayout>
  );
}
