import OngLogoField from './OngLogoField';
import RegistrationForm from './RegistrationForm';
import { RegistrationCepField, RegistrationField, RegistrationPhoneField } from './RegistrationFields';
import formatOnBlur from './formatOnBlur';

const benefits = [
  'Painel para animais e doações',
  'Mural público de adoção',
  'Contato direto pelo WhatsApp',
];

const formatCnpj = formatOnBlur(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([0-9]{2})$/i, '$1.$2.$3/$4-$5');

export default function RegisterOng() {
  return (
    <RegistrationForm
      title="Cadastro de ONG"
      intro={<>Gerencie sua ONG em<br />um só lugar</>}
      description="Cadastre sua organização para divulgar animais, registrar doações e ampliar o alcance das suas campanhas."
      benefits={benefits}
      prompt="Informe os dados da organização."
      submitLabel="Cadastrar ONG"
    >
      <fieldset className="registration-section">
        <legend>Organização</legend>
        <RegistrationField name="organization" label="Nome da ONG" autoComplete="organization" placeholder="Ex.: Amor de Pet" />
        <RegistrationField
          name="cnpj"
          label="CNPJ"
          autoCapitalize="characters"
          spellCheck={false}
          pattern={String.raw`(?:[A-Za-z0-9]{12}[0-9]{2}|[A-Za-z0-9]{2}\.[A-Za-z0-9]{3}\.[A-Za-z0-9]{3}/[A-Za-z0-9]{4}-[0-9]{2})`}
          onBlur={formatCnpj}
          placeholder="00.000.000/0000-00"
          title="Informe os 14 caracteres do CNPJ, com os dois últimos em números."
        />
        <OngLogoField />
      </fieldset>

      <fieldset className="registration-section">
        <legend>Contato</legend>
        <RegistrationField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@ong.org.br"
          help="Informe o e-mail que você usará para entrar."
        />
        <RegistrationPhoneField />
      </fieldset>

      <fieldset className="registration-section">
        <legend>Endereço</legend>
        <div className="registration-fields-row">
          <RegistrationCepField />
          <RegistrationField name="number" label="Número" placeholder="Ex.: 120" />
        </div>
        <RegistrationField name="street" label="Rua" autoComplete="address-line1" placeholder="Ex.: Rua das Flores" />
        <div className="registration-fields-row">
          <RegistrationField name="district" label="Bairro" autoComplete="address-level3" placeholder="Jardim Satélite" />
          <RegistrationField name="city" label="Cidade / UF" placeholder="São José dos Campos – SP" />
        </div>
      </fieldset>
    </RegistrationForm>
  );
}
