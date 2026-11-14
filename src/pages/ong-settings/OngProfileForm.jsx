import { useRef, useState } from 'react';
import useCepLookup from '@/app/useCepLookup';

const profileAddress = { city: 'localidade', state: 'estado' };

const states = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
];

const masks = {
  cnpj: [/^([a-z0-9]{2})([a-z0-9]{3})([a-z0-9]{3})([a-z0-9]{4})([0-9]{2})$/i, '$1.$2.$3/$4-$5'],
  whatsapp: [/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3'],
  cep: [/^(\d{5})(\d{3})$/, '$1-$2'],
};

function Field({ label, name, hint, prefix, count, value, ...props }) {
  const id = 'ong-field-' + name;
  return (
    <div className="tutor-field">
      <label htmlFor={id}>{label}</label>
      <div className="tutor-input">
        {prefix && <span className="tutor-prefix" aria-hidden="true">{prefix}</span>}
        <input id={id} name={name} value={value} aria-describedby={hint ? id + '-hint' : undefined} {...props} />
        {count && <span className="tutor-count" aria-hidden="true">{value.length}/60</span>}
      </div>
      {hint && <small id={id + '-hint'}>{hint}</small>}
    </div>
  );
}

export default function OngProfileForm({ profile, save }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');
  const bio = useRef(null);

  const { lookup, message: cepMessage } = useCepLookup(profileAddress, (address) => {
    setDraft((current) => ({ ...current, ...address }));
  });

  function update(name, value) {
    setError('');
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function change({ target }) {
    update(target.name, target.value);
  }

  function formatBio(mark) {
    const input = bio.current;
    const { selectionStart: start, selectionEnd: end } = input;
    const text = draft.bio;
    if (text.length + 2 * mark.length > input.maxLength) return;
    update('bio', text.slice(0, start) + mark + text.slice(start, end) + mark + text.slice(end));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + mark.length, end + mark.length);
    });
  }

  function submit(event) {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(draft).map(([name, value]) => [name, value.trim()]));
    if (/(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|br)\b|\bcupom\s*[:#-]?\s*[\w-]*\d[\w-]*)/i.test(next.bio)) {
      setError('Remova os links e códigos de cupom da descrição.');
      bio.current.focus();
      return;
    }
    if (next.website && !/^https?:\/\//i.test(next.website)) {
      setError('Informe um site que comece com https:// ou http://.');
      event.currentTarget.elements.website.focus();
      return;
    }
    next.cnpj = next.cnpj.toUpperCase();
    if (save({ profile: next })) setDraft(next);
  }

  function field(name, label, props) {
    const mask = masks[name];
    return (
      <Field name={name} label={label} value={draft[name]} onChange={change}
        onBlur={mask ? (event) => {
          const { target } = event;
          const compact = target.value.replace(/[()./\s-]/g, '');
          if (mask[0].test(compact)) update(name, compact.replace(...mask));
          if (name === 'cep') lookup(event);
        } : undefined} {...props} />
    );
  }

  return (
    <form className="tutor-body" onSubmit={submit}>
      <fieldset>
        <legend>Dados da ONG</legend>
        {field('name', 'Nome da ONG', { required: true, pattern: '.*\\S.*', maxLength: 100, autoComplete: 'organization', placeholder: 'Ex.: Amor de Pet' })}
        <div className="tutor-columns">
          {field('cnpj', 'CNPJ', { maxLength: 18, placeholder: '00.000.000/0000-00' })}
          {field('founded', 'Ano de fundação', { type: 'number', min: 1000, max: new Date().getFullYear(), placeholder: 'Ex.: 2015' })}
        </div>
        {field('tagline', 'Slogan', { maxLength: 60, count: true, placeholder: 'Ex.: Todo animal merece um lar',
          hint: 'Uma frase curta que aparece abaixo do nome da ONG.' })}
        <div className="tutor-field">
          <label htmlFor="ong-bio">Sobre a ONG</label>
          <div className="tutor-editor">
            <div className="tutor-toolbar">
              <button type="button" aria-label="Negrito" onClick={() => formatBio('**')}><b>B</b></button>
              <button type="button" aria-label="Itálico" onClick={() => formatBio('*')}><i>I</i></button>
            </div>
            <textarea id="ong-bio" name="bio" ref={bio} value={draft.bio} onChange={change}
              maxLength={3000} placeholder="Conte a história e a missão da ONG" aria-describedby="ong-bio-hint" />
          </div>
          <small id="ong-bio-hint">Use a seção Links e doações para adicionar endereços. Evite códigos de cupom na descrição.</small>
        </div>
      </fieldset>
      <fieldset>
        <legend>Contato e localização</legend>
        <div className="tutor-columns">
          {field('email', 'E-mail de contato', { type: 'email', autoComplete: 'email', placeholder: 'contato@ong.org.br' })}
          {field('whatsapp', 'WhatsApp', { type: 'tel', autoComplete: 'tel-national', maxLength: 15, placeholder: '(99) 99999-9999' })}
          {field('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 9, placeholder: '00000-000', pattern: '[0-9]{5}-?[0-9]{3}',
            hint: cepMessage ? <span role="status">{cepMessage}</span> : undefined,
            onChange: (event) => { change(event); lookup(event); },
          })}
          {field('city', 'Cidade', { autoComplete: 'address-level2', maxLength: 100 })}
          <div className="tutor-field">
            <label htmlFor="ong-state">Estado</label>
            <select id="ong-state" name="state" value={draft.state} onChange={change} autoComplete="address-level1">
              <option value="">Selecione</option>
              {draft.state && !states.includes(draft.state) && <option>{draft.state}</option>}
              {states.map((state) => <option key={state}>{state}</option>)}
            </select>
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>Links e doações</legend>
        {field('website', 'Site', { type: 'url', maxLength: 300, placeholder: 'https://' })}
        {field('instagram', 'Instagram', { prefix: 'instagram.com/', placeholder: 'Nome de usuário', maxLength: 50,
          pattern: '@?[a-zA-Z0-9._]+', hint: 'Informe o nome de usuário do Instagram (ex.: amordepet).' })}
        {field('facebook', 'Facebook', { prefix: 'facebook.com/', placeholder: 'Nome de usuário', maxLength: 50,
          pattern: '@?[a-zA-Z0-9._]+', hint: 'Informe o nome de usuário do Facebook.' })}
        {field('pixKey', 'Chave PIX para doações', { placeholder: 'CNPJ, e-mail ou chave aleatória', maxLength: 150,
          hint: 'A chave aparece na seção Como ajudar da prévia pública.' })}
      </fieldset>
      {error && <p className="tutor-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit">Salvar</button>
    </form>
  );
}
