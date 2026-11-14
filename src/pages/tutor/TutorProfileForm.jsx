import { useRef, useState } from 'react';

const states = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
];

function Field({ label, name, value, onChange, hint, prefix, count, ...props }) {
  return (
    <div className="tutor-field">
      <label htmlFor={name}>{label}</label>
      <div className="tutor-input">
        {prefix && <span className="tutor-prefix">{prefix}</span>}
        <input id={name} name={name} value={value} onChange={onChange}
          aria-describedby={hint ? name + '-hint' : undefined} {...props} />
        {count && <span className="tutor-count">{value.length}/60</span>}
      </div>
      {hint && <small id={name + '-hint'}>{hint}</small>}
    </div>
  );
}

export default function TutorProfileForm({ profile, save }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');
  const bio = useRef(null);

  function change(event) {
    setError('');
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function format(mark) {
    const input = bio.current;
    const { selectionStart: start, selectionEnd: end } = input;
    const text = draft.bio;
    setDraft({ ...draft, bio: text.slice(0, start) + mark + text.slice(start, end) + mark + text.slice(end) });
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + mark.length, end + mark.length);
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setError('Informe seu nome e sobrenome.');
      return;
    }
    if (/(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|br)\b)/i.test(draft.bio)) {
      setError('Use a seção Links para adicionar endereços à web.');
      bio.current.focus();
      return;
    }
    if (draft.website && !/^https?:\/\//i.test(draft.website)) {
      setError('O endereço do site deve começar com https:// ou http://.');
      return;
    }
    const profile = { ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() };
    if (await save({ profile })) setDraft(profile);
  }

  function field(name, label, props) {
    return <Field name={name} label={label} value={draft[name]} onChange={change} {...props} />;
  }

  return (
    <form className="tutor-body" onSubmit={submit}>
      <fieldset>
        <legend>Dados básicos</legend>
        <div className="tutor-columns">
          {field('firstName', 'Nome', { autoComplete: 'given-name', required: true })}
          {field('lastName', 'Sobrenome', { autoComplete: 'family-name', required: true })}
        </div>
        {field('intro', 'Apresentação curta', {
          maxLength: 60, count: true, placeholder: 'Ex.: Tutor da Mel e do Thor',
          hint: 'Adicione uma frase curta sobre você, como “Tutor de dois gatos”.',
        })}
        <div className="tutor-field">
          <label htmlFor="bio">Biografia</label>
          <div className="tutor-editor">
            <div className="tutor-toolbar">
              <button type="button" aria-label="Negrito" onClick={() => format('**')}><b>B</b></button>
              <button type="button" aria-label="Itálico" onClick={() => format('*')}><i>I</i></button>
            </div>
            <textarea ref={bio} id="bio" name="bio" maxLength={3000} value={draft.bio} onChange={change}
              aria-describedby="bio-hint" placeholder="Conte um pouco sobre você e seus animais" />
          </div>
          <small id="bio-hint">Selecione um trecho para formatá-lo. Use a seção Links para compartilhar endereços.</small>
        </div>
        <div className="tutor-columns">
          {field('city', 'Cidade', { autoComplete: 'address-level2' })}
          <div className="tutor-field">
            <label htmlFor="state">Estado</label>
            <select id="state" name="state" value={draft.state} onChange={change} autoComplete="address-level1">
              <option value="">Selecione</option>
              {draft.state && !states.includes(draft.state) && <option>{draft.state}</option>}
              {states.map((state) => <option key={state}>{state}</option>)}
            </select>
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>Contato</legend>
        <div className="tutor-columns">
          {field('email', 'E-mail', { type: 'email', autoComplete: 'email', placeholder: 'voce@email.com' })}
          {field('phone', 'WhatsApp', {
            type: 'tel', autoComplete: 'tel', placeholder: '(99) 99999-9999',
            hint: 'Contato para ocorrências envolvendo seus animais.',
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Links</legend>
        {field('website', 'Site', { type: 'url', placeholder: 'https://' })}
        {field('instagram', 'Instagram', {
          prefix: 'instagram.com/', placeholder: 'Nome de usuário',
          hint: 'Informe o nome de usuário do Instagram (ex.: johnsmith).',
        })}
        {field('facebook', 'Facebook', {
          prefix: 'facebook.com/', placeholder: 'Nome de usuário',
          hint: 'Informe o nome de usuário do Facebook.',
        })}
      </fieldset>
      {error && <p className="tutor-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit">Salvar</button>
    </form>
  );
}
