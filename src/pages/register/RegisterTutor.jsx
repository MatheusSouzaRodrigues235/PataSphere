import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';
import AuthLayout from '@/layouts/AuthLayout';

const benefits = [
  'Solicite adoções direto pelo WhatsApp',
  'Anuncie animais perdidos ou encontrados',
  'Acompanhe seus anúncios',
];

function formatOnBlur(pattern, replacement) {
  return (event) => {
    const input = event.currentTarget;
    const digits = input.value.replace(/[().\s-]/g, '');
    if (pattern.test(digits)) {
      input.value = digits.replace(pattern, replacement);
    }
  };
}

const formatCpf = formatOnBlur(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
const formatPhone = formatOnBlur(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
const formatCep = formatOnBlur(/^(\d{5})(\d{3})$/, '$1-$2');

function TutorField({ name, label, help, ...inputProps }) {
  const id = `tutor-${name}`;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        className="form-control"
        aria-describedby={help ? `${id}-help` : undefined}
        required
        {...inputProps}
      />
      {help && <p id={`${id}-help`} className="tutor-help">{help}</p>}
    </div>
  );
}

export default function RegisterTutor() {
  const heading = useRef(null);
  const [password, setPassword] = useState('');
  const [policyMessage, setPolicyMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const passwordCriteria = [
    password.length >= 8,
    /\p{L}/u.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;
  const hasExtraStrength = password.length >= 12 || /[^\p{L}0-9\s]/u.test(password);
  const strength = passwordCriteria + Number(passwordCriteria === 3 && hasExtraStrength);

  useEffect(() => {
    heading.current.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('Formulário validado. A criação de contas estará disponível em uma próxima etapa.');
  }

  return (
    <AuthLayout
      title="Cadastro de tutor"
      intro={<>Adote, divulgue,<br />reencontre</>}
      description="Crie sua conta de tutor e ajude animais a encontrar um lar ou voltar para casa."
      benefits={benefits}
    >
      <div className="register-content">
        <h1 id="auth-title" ref={heading} tabIndex={-1}>Cadastro de tutor</h1>
        <p className="auth-description">Preencha seus dados para criar a conta.</p>

        <form className="tutor-form" onSubmit={handleSubmit} onChange={() => setFeedback('')}>
          <fieldset className="tutor-section">
            <legend>Dados pessoais</legend>
            <div className="tutor-fields-row">
              <TutorField name="firstName" label="Nome" autoComplete="given-name" placeholder="Matheus" />
              <TutorField name="lastName" label="Sobrenome" autoComplete="family-name" placeholder="Souza Rodrigues" />
            </div>
            <TutorField
              name="cpf"
              label="CPF"
              inputMode="numeric"
              pattern={String.raw`(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})`}
              onBlur={formatCpf}
              placeholder="000.000.000-00"
              help="Informe os 11 dígitos do CPF."
            />
          </fieldset>

          <fieldset className="tutor-section">
            <legend>Contato</legend>
            <TutorField
              name="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              help="Informe o e-mail que você usará para entrar."
            />
            <TutorField
              name="phone"
              label="Telefone / WhatsApp"
              type="tel"
              autoComplete="tel-national"
              pattern={String.raw`(?:[0-9]{10,11}|\([0-9]{2}\) [0-9]{4,5}-[0-9]{4})`}
              onBlur={formatPhone}
              placeholder="(99) 99999-9999"
              title="Informe o DDD e o número, com 10 ou 11 dígitos."
            />
          </fieldset>

          <fieldset className="tutor-section">
            <legend>Localização</legend>
            <div className="tutor-fields-row">
              <TutorField
                name="cep"
                label="CEP"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[0-9]{5}-?[0-9]{3}"
                onBlur={formatCep}
                placeholder="00000-000"
                title="Informe os 8 dígitos do CEP."
              />
              <TutorField
                name="city"
                label="Cidade / UF"
                placeholder="São José dos Campos – SP"
                aria-describedby="tutor-location-help"
              />
            </div>
            <p className="tutor-help" id="tutor-location-help">Informe sua cidade e a sigla do estado.</p>
          </fieldset>

          <fieldset className="tutor-section">
            <legend>Acesso</legend>
            <div className="auth-field">
              <label htmlFor="tutor-password">Senha</label>
              <AuthPasswordInput
                id="tutor-password"
                name="password"
                autoComplete="new-password"
                placeholder="Crie uma senha"
                aria-describedby="tutor-password-help"
                minLength={8}
                pattern={String.raw`(?=.*\p{L})(?=.*[0-9]).{8,}`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <p className="tutor-help" id="tutor-password-help">Mínimo de 8 caracteres, com letras e números.</p>
            </div>
            <meter className="visually-hidden" min={0} max={4} value={strength} aria-label="Força da senha" />
            <div className="tutor-strength" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={level <= strength ? 'is-filled' : undefined} />
              ))}
            </div>
            <div className="tutor-consent">
              <input id="tutor-consent" name="consent" type="checkbox" required aria-labelledby="tutor-consent-text" />
              <div id="tutor-consent-text">
                <label htmlFor="tutor-consent">Li e aceito os</label>{' '}
                <button type="button" className="auth-action" onClick={() => setPolicyMessage('Os Termos de uso estarão disponíveis antes da abertura dos cadastros.')}>
                  Termos de uso
                </button>{' '}
                e a{' '}
                <button type="button" className="auth-action" onClick={() => setPolicyMessage('A Política de Privacidade estará disponível antes da abertura dos cadastros.')}>
                  Política de Privacidade
                </button>.
              </div>
              <p className="tutor-notice" role="status">{policyMessage}</p>
            </div>
          </fieldset>

          <button className="auth-submit" type="submit">Criar conta</button>
        </form>
        <p className="auth-feedback" role="status">{feedback}</p>
        <p className="auth-switch">
          Já tem conta? <Link to="/login" className="auth-action">Entrar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
