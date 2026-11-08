import RegistrationForm from './RegistrationForm';
import { RegistrationCepField, RegistrationField, RegistrationPhoneField } from './RegistrationFields';
import formatOnBlur from './formatOnBlur';

const benefits = [
  'Solicite adoções direto pelo WhatsApp',
  'Anuncie animais perdidos ou encontrados',
  'Acompanhe seus anúncios',
];

const formatCpf = formatOnBlur(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

export default function RegisterTutor() {
  return (
    <RegistrationForm
      title="Cadastro de tutor"
      intro={<>Adote, divulgue,<br />reencontre</>}
      description="Crie sua conta de tutor e ajude animais a encontrar um lar ou voltar para casa."
      benefits={benefits}
      prompt="Preencha seus dados para criar a conta."
      submitLabel="Criar conta"
    >
      <fieldset className="registration-section">
        <legend>Dados pessoais</legend>
        <div className="registration-fields-row">
          <RegistrationField name="firstName" label="Nome" autoComplete="given-name" placeholder="Matheus" />
          <RegistrationField name="lastName" label="Sobrenome" autoComplete="family-name" placeholder="Souza Rodrigues" />
        </div>
        <RegistrationField
          name="cpf"
          label="CPF"
          inputMode="numeric"
          pattern={String.raw`(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})`}
          onBlur={formatCpf}
          placeholder="000.000.000-00"
          help="Informe os 11 dígitos do CPF."
        />
      </fieldset>

      <fieldset className="registration-section">
        <legend>Contato</legend>
        <RegistrationField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          help="Informe o e-mail que você usará para entrar."
        />
        <RegistrationPhoneField />
      </fieldset>

      <fieldset className="registration-section">
        <legend>Localização</legend>
        <div className="registration-fields-row">
          <RegistrationCepField />
          <RegistrationField
            name="city"
            label="Cidade / UF"
            placeholder="São José dos Campos – SP"
            aria-describedby="tutor-location-help"
          />
        </div>
        <p className="registration-help" id="tutor-location-help">Informe sua cidade e a sigla do estado.</p>
      </fieldset>
    </RegistrationForm>
  );
}
