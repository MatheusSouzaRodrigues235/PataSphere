import { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearDemoRole, startDemoRole } from '@/app/demoSession';
import { useAccountSession } from '@/app/accountSession';
import AuthLayout from '@/layouts/AuthLayout';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';

const benefits = [
  'Adoção responsável',
  'Animais perdidos e encontrados',
  'Gestão simples para ONGs',
];

export default function Login() {
  const [feedback, setFeedback] = useState('');

  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();
  const account = useAccountSession();

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setFeedback('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result = await response.json();
      if (!response.ok) {
        setFeedback(result.message);
        return;
      }
      const role = result.account?.role;
      if (role !== 'tutor' && role !== 'ong') throw new Error('Perfil da conta indisponível');
      clearDemoRole();
      const returnTo = state?.returnTo;
      const dashboardPath = /^\/dashboard\/ong(?:[/?]|$)/.test(returnTo) ? returnTo : '/dashboard/ong';
      if (returnTo === '/animais-perdidos/cadastro') {
        await navigate(returnTo, { replace: true, state: state?.lostAnimalForm });
      } else if (role === 'tutor' && /^\/adocao\/[1-9]\d*$/.test(returnTo)) {
        await navigate(returnTo, { replace: true });
      } else {
        await navigate(role === 'tutor' ? '/adocao' : dashboardPath, { replace: true });
      }
    } catch {
      setFeedback('Não foi possível acessar o serviço de login. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      intro="Bem-vindo de volta"
      description="Entre para acompanhar seus animais, solicitações e doações."
      benefits={benefits}
    >
      <div className="login-content">
        <h1 id="auth-title">Entrar</h1>
        <p className="auth-description">
          Use o e-mail e a senha do seu cadastro de tutor ou ONG.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              className="form-control"
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="voce@email.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Senha</label>
            <AuthPasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            className="auth-action login-forgot"
            type="button"
            onClick={() => setFeedback('A recuperação de senha estará disponível em breve.')}
          >
            Esqueci minha senha
          </button>

          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'} <FiArrowRight aria-hidden="true" />
          </button>
        </form>

        <p className="auth-switch">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="auth-action">Cadastre-se</Link>
        </p>
        {!account && <p className="auth-switch"><Link to="/perfil/tutor" onClick={() => startDemoRole('tutor')} className="auth-action">Experimentar perfil do tutor</Link></p>}
        {!account && <p className="auth-switch"><Link to="/perfil/ong" onClick={() => startDemoRole('ong')} className="auth-action">Experimentar perfil da ONG</Link></p>}
        <p className="auth-feedback" role="status">{feedback}</p>
      </div>
    </AuthLayout>
  );
}
