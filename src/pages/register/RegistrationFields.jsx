import { useId } from 'react';
import useCepLookup from '@/app/useCepLookup';
import formatOnBlur from './formatOnBlur';

const formatPhone = formatOnBlur(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
const formatCep = formatOnBlur(/^(\d{5})(\d{3})$/, '$1-$2');

export function RegistrationField({ name, label, help, ...inputProps }) {
  const id = useId();

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
      {help && <p id={`${id}-help`} className="registration-help">{help}</p>}
    </div>
  );
}

export function RegistrationPhoneField() {
  return (
    <RegistrationField
      name="phone"
      label="Telefone / WhatsApp"
      type="tel"
      autoComplete="tel-national"
      pattern={String.raw`(?:[0-9]{10,11}|\([0-9]{2}\) [0-9]{4,5}-[0-9]{4})`}
      onBlur={formatPhone}
      placeholder="(99) 99999-9999"
      title="Informe o DDD e o número, com 10 ou 11 dígitos."
    />
  );
}

const registrationAddress = { street: 'logradouro', district: 'bairro', city: 'cityWithUf' };

export function RegistrationCepField() {
  const { lookup, message } = useCepLookup(registrationAddress);
  return (
    <RegistrationField
      name="cep"
      label="CEP"
      inputMode="numeric"
      autoComplete="postal-code"
      pattern="[0-9]{5}-?[0-9]{3}"
      maxLength={9}
      onChange={lookup}
      onBlur={(event) => { formatCep(event); lookup(event); }}
      placeholder="00000-000"
      title="Informe os 8 dígitos do CEP."
      help={message ? <span role="status">{message}</span> : undefined}
    />
  );
}
