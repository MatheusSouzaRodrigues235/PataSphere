import { useState } from 'react';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';

export default function RegistrationAccess() {
  const [password, setPassword] = useState('');
  const [policyMessage, setPolicyMessage] = useState('');

  const passwordCriteria = [
    password.length >= 8,
    /\p{L}/u.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;
  const hasExtraStrength = password.length >= 12 || /[^\p{L}0-9\s]/u.test(password);
  const strength = passwordCriteria + Number(passwordCriteria === 3 && hasExtraStrength);

  return (
    <fieldset className="registration-section">
      <legend>Acesso</legend>
      <div className="auth-field">
        <label htmlFor="registration-password">Senha</label>
        <AuthPasswordInput
          id="registration-password"
          name="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          aria-describedby="registration-password-help"
          minLength={8}
          pattern={String.raw`(?=.*\p{L})(?=.*[0-9]).{8,}`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <p className="registration-help" id="registration-password-help">Mínimo de 8 caracteres, com letras e números.</p>
      </div>
      <meter className="visually-hidden" min={0} max={4} value={strength} aria-label="Força da senha" />
      <div className="registration-strength" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={level <= strength ? 'is-filled' : undefined} />
        ))}
      </div>
      <div className="registration-consent">
        <input id="registration-consent" name="consent" type="checkbox" required aria-labelledby="registration-consent-text" />
        <div id="registration-consent-text">
          <label htmlFor="registration-consent">Li e aceito os</label>{' '}
          <button type="button" className="auth-action" onClick={() => setPolicyMessage('Os Termos de uso estarão disponíveis antes da abertura dos cadastros.')}>
            Termos de uso
          </button>{' '}
          e a{' '}
          <button type="button" className="auth-action" onClick={() => setPolicyMessage('A Política de Privacidade estará disponível antes da abertura dos cadastros.')}>
            Política de Privacidade
          </button>.
        </div>
        <p className="registration-notice" role="status">{policyMessage}</p>
      </div>
    </fieldset>
  );
}
