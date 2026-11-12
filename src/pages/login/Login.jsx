import { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { startDemoRole } from '@/app/demoSession';
import AuthLayout from '@/layouts/AuthLayout';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';

const benefits = [
  'Adoção responsável',
  'Animais perdidos e encontrados',
  'Gestão simples para ONGs',
];

export default function Login() {
  const [feedback, setFeedback] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('A autenticação ainda não está disponível.');
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
          Use o e-mail e a senha do seu cadastro. Você será levado ao painel do seu perfil (tutor ou ONG).
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

          <button className="auth-submit" type="submit">
            Entrar <FiArrowRight aria-hidden="true" />
          </button>
        </form>

        <p className="auth-switch">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="auth-action">Cadastre-se</Link>
        </p>
        <p className="auth-switch"><Link to="/perfil/tutor" onClick={() => startDemoRole('tutor')} className="auth-action">Experimentar perfil do tutor</Link></p>
        <p className="auth-switch"><Link to="/perfil/ong" onClick={() => startDemoRole('ong')} className="auth-action">Experimentar perfil da ONG</Link></p>
        <p className="auth-feedback" role="status">{feedback}</p>
      </div>
    </AuthLayout>
  );
}
