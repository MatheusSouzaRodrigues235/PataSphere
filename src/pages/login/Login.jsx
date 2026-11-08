import { useState } from 'react';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-patasphere.svg';

const benefits = [
  'Adoção responsável',
  'Animais perdidos e encontrados',
  'Gestão simples para ONGs',
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('A autenticação ainda não está disponível.');
  }

  return (
    <main className="login-page">
      <title>Entrar | PataSphere</title>
      <aside className="login-intro" aria-labelledby="login-welcome">
        <div>
          <Link to="/" className="login-logo" aria-label="PataSphere, página inicial">
            <img src={logo} alt="" width={64} height={64} />
          </Link>
          <h2 id="login-welcome">Bem-vindo de volta</h2>
          <p className="login-intro-text">Entre para acompanhar seus animais, solicitações e doações.</p>
          <ul className="login-benefits" role="list">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <span className="login-benefit-icon"><FiCheck aria-hidden="true" /></span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <p className="login-credit">PataSphere – Trabalho acadêmico · UNINTER</p>
      </aside>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-content">
          <h1 id="login-title">Entrar</h1>
          <p className="login-description">
            Use o e-mail e a senha do seu cadastro. Você será levado ao painel do seu perfil (tutor ou ONG).
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div>
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

            <div>
              <label htmlFor="login-password">Senha</label>
              <div className="login-password-field">
                <input
                  className="form-control"
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-controls="login-password"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              className="login-action login-forgot"
              type="button"
              onClick={() => setFeedback('A recuperação de senha estará disponível em breve.')}
            >
              Esqueci minha senha
            </button>

            <button className="login-submit" type="submit">
              Entrar <FiArrowRight aria-hidden="true" />
            </button>
          </form>

          <p className="login-signup">
            Ainda não tem conta?{' '}
            <button
              className="login-action"
              type="button"
              onClick={() => setFeedback('O cadastro estará disponível em breve.')}
            >
              Cadastre-se
            </button>
          </p>
          <p className="login-feedback" role="status">{feedback}</p>
        </div>
      </section>
    </main>
  );
}
