import { useState } from 'react';
import { FiArrowRight, FiUser } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';

const benefits = [
  'Cadastro em poucos passos',
  'Dados protegidos (LGPD)',
  'Funciona no celular',
];

const profiles = [
  {
    value: 'tutor',
    title: 'Sou tutor',
    description: 'Quero adotar, anunciar um animal perdido ou avisar que encontrei um.',
    icon: FiUser,
  },
  {
    value: 'ong',
    title: 'Sou uma ONG',
    description: 'Quero cadastrar animais para adoção, gerenciar doações e divulgar a causa.',
    icon: LuPawPrint,
  },
];

export default function ChooseProfile() {
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    if (new FormData(event.currentTarget).get('profile') === 'tutor') {
      navigate('/cadastro/tutor');
      return;
    }
    setFeedback('O cadastro de ONG estará disponível em breve.');
  }

  return (
    <AuthLayout
      title="Escolha de perfil"
      intro="Crie sua conta"
      description="Escolha como você quer participar do PataSphere. É rápido e gratuito."
      benefits={benefits}
    >
      <div className="register-content">
        <h1 id="auth-title">Como você quer participar?</h1>
        <p id="profile-help" className="auth-description">
          Você pode mudar essas informações depois, no seu perfil.
        </p>

        <form className="register-form" onSubmit={handleSubmit}>
          <fieldset className="profile-options" aria-describedby="profile-help">
            <legend className="visually-hidden">Escolha seu perfil</legend>
            {profiles.map(({ value, title, description, icon: Icon }) => (
              <label className={`profile-option profile-option--${value}`} key={value}>
                <input
                  className="profile-radio"
                  type="radio"
                  name="profile"
                  value={value}
                  defaultChecked={value === 'tutor'}
                  aria-labelledby={`profile-${value}-title`}
                  aria-describedby={`profile-${value}-description`}
                  onChange={() => setFeedback('')}
                />
                <span className="profile-icon"><Icon aria-hidden="true" /></span>
                <span id={`profile-${value}-title`} className="profile-title">{title}</span>
                <span id={`profile-${value}-description`} className="profile-description">{description}</span>
              </label>
            ))}
          </fieldset>
          <button className="auth-submit" type="submit">
            Continuar <FiArrowRight aria-hidden="true" />
          </button>
        </form>

        <p className="auth-switch">
          Já tem conta? <Link to="/login" className="auth-action">Entrar</Link>
        </p>
        <p className="auth-feedback" role="status">{feedback}</p>
      </div>
    </AuthLayout>
  );
}
