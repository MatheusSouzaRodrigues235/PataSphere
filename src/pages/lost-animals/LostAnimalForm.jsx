import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FiCamera, FiCheck, FiChevronLeft, FiChevronRight, FiSend, FiX } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useMapLocation from '@/app/useMapLocation';
import useCepLookup from '@/app/useCepLookup';
import { useAccountSession } from '@/app/accountSession';
import { requestLostAnimals } from './lostAnimalsApi';
import { ages, sexes, sizes, species, urgencies } from '@/pages/dashboard/animals';
import formatOnBlur from '@/pages/register/formatOnBlur';
import { lostAnimalsPath, todayDate } from './lostAnimalsData';
import { tutorAnimalsPath } from '@/pages/tutor/tutorStorage';
import '@/styles/_lost-registration.scss';

const ongAlertsPath = '/dashboard/ong/animais-perdidos';
const OccurrenceMap = lazy(() => import('./OccurrenceMap'));
const steps = ['Dados básicos', 'Detalhes e fotos', 'Local da ocorrência'];
const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
const formatPhone = formatOnBlur(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
const occurrenceAddress = { street: 'logradouro', neighborhood: 'bairro', city: 'localidade', region: 'uf' };
const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

async function readPhoto(file) {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.8);
  } finally {
    image.close();
  }
}

function Field({ label, options, wide, controlled, value = '', ...props }) {
  const inputValue = controlled ? { value } : { defaultValue: value };
  return (
    <label className={wide ? 'lost-registration-wide' : undefined}>
      {label}
      {options ? (
        <select className="form-select" {...inputValue} {...props}>
          <option value="" disabled>Selecione</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : <input className="form-control" {...inputValue} {...props} />}
    </label>
  );
}

function PhotoPicker({ photos, onChange, loading, setLoading }) {
  const input = useRef(null);
  const [error, setError] = useState('');

  async function selectPhotos(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;
    if (files.length + photos.length > 4 || files.some((file) => !file.size || file.size > 5 * 1024 * 1024 || !photoTypes.includes(file.type))) {
      setError('Escolha até 4 fotos JPG, PNG ou WebP de até 5 MB cada.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const images = await Promise.all(files.map(readPhoto));
      onChange([...new Set([...photos, ...images])]);
    } catch {
      setError('Não foi possível carregar as fotos. Tente selecionar os arquivos novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="lost-registration-upload">
        <FiCamera aria-hidden="true" />
        <p>Adicione até 4 fotos do animal</p>
        <input ref={input} type="file" accept={photoTypes.join(',')} multiple hidden onChange={selectPhotos} />
        <button type="button" className="adoption-action lost-registration-dark" disabled={loading || photos.length === 4} onClick={() => input.current.click()}>
          {loading ? 'Carregando…' : 'Carregar fotos'}
        </button>
      </div>
      {error && <p className="text-danger" role="alert">{error}</p>}
      {photos.length > 0 && (
        <ul className="lost-registration-previews" aria-label="Fotos selecionadas">
          {photos.map((photo, index) => (
            <li key={photo}>
              <img src={photo} alt={'Foto ' + (index + 1)} />
              <button type="button" className="adoption-control" disabled={loading} aria-label={'Remover foto ' + (index + 1)} onClick={() => onChange(photos.filter((image) => image !== photo))}>
                <FiX aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function LostAnimalForm() {
  const account = useAccountSession();
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const heading = useRef(null);
  const publicationKey = useRef(null);
  const submitting = useRef(false);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState(() => new URLSearchParams(search || state?.boardSearch).get('tipo') === 'encontrados' ? 'found' : 'lost');
  const [draft, setDraft] = useState({});
  const [photos, setPhotos] = useState([]);
  const [selection, setSelection] = useState(null);
  const [cepChanged, setCepChanged] = useState(false);
  const { lookup, message: cepMessage, reset: resetCepLookup } = useCepLookup(occurrenceAddress, (address) => {
    setDraft((current) => ({ ...current, ...address }));
    setCepChanged(false);
  });
  const cep = /^\d{5}-?\d{3}$/.test(draft.cep ?? '') ? draft.cep : '';
  const typedAddress = draft.city && draft.region
    ? [draft.street, draft.neighborhood, draft.city, draft.region].filter(Boolean).join(', ')
    : '';
  const address = step === 2 && account
    ? (cepChanged && cep ? cep : typedAddress || cep)
    : '';
  const { location, loading: locating, error: mapError, retry: retryMap } = useMapLocation(address, cep);
  const locationKey = JSON.stringify([address, cep]);
  const point = selection?.key === locationKey ? selection.point : null;
  const mapLocation = selection?.key === locationKey ? null : location;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const found = kind === 'found';
  const boardUrl = { pathname: lostAnimalsPath, search: state?.boardSearch ?? '' };

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step]);

  function readFields(form) {
    return Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]));
  }

  function back(form) {
    resetCepLookup();
    setDraft({ ...draft, ...readFields(form) });
    setError('');
    setStep(step - 1);
  }

  async function submit(event) {
    event.preventDefault();
    if (loading || submitting.current) return;
    const values = { ...draft, ...readFields(event.currentTarget) };
    if (step === 1 && (!values.description || !photos.length)) {
      setError(!values.description ? 'Descreva o animal antes de continuar.' : 'Adicione pelo menos uma foto para continuar.');
      return;
    }
    if (step < 2) {
      setDraft(values);
      setError('');
      setStep(step + 1);
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError('');
    let alert;
    try {
      publicationKey.current ??= crypto.randomUUID();
      ({ alert } = await requestLostAnimals('', {
        method: 'POST', body: { ...values, key: publicationKey.current, kind, photos, point },
      }));
    } catch (requestError) {
      setError(requestError.message);
      return;
    } finally {
      submitting.current = false;
      setLoading(false);
    }
    if (state?.returnToOng) {
      navigate(ongAlertsPath, { replace: true, state: { registeredAnimal: alert.name } });
      return;
    }
    if (state?.returnToTutor) {
      navigate(tutorAnimalsPath, { replace: true, state: { registeredAnimal: alert.name } });
      return;
    }
    navigate(lostAnimalsPath + '/' + alert.id, {
      replace: true,
      state: { boardSearch: found ? 'tipo=encontrados' : '', published: true },
    });
  }

  if (!account) return <Navigate to="/login" replace state={{ returnTo: lostAnimalsPath + '/cadastro' + (found ? '?tipo=encontrados' : ''), lostAnimalForm: state }} />;

  const field = (props) => Object.hasOwn(occurrenceAddress, props.name) || props.name === 'cep'
    ? <Field {...props} controlled value={draft[props.name]} onChange={(event) => {
        const value = event.target.value;
        setCepChanged(props.name === 'cep');
        setDraft((current) => ({ ...current, [props.name]: value }));
        props.onChange?.(event);
      }} />
    : <Field {...props} value={draft[props.name]} />;
  const title = step === 0 ? (found ? 'Cadastrar animal encontrado' : 'Cadastrar animal perdido') : steps[step];

  return (
    <section className="adoption-board lost-registration" aria-labelledby="lost-registration-title">
      <div className="adoption-container">
        <h1 id="lost-registration-title" ref={heading} tabIndex={-1}>{title}</h1>
        <p className="adoption-intro">
          {[
            'Conte o essencial sobre o animal para ajudar no reencontro.',
            'Uma boa descrição e uma foto nítida aumentam as chances de reencontro.',
            found ? 'Informe onde você encontrou o animal.' : 'Informe onde o animal foi visto pela última vez.',
          ][step]}
        </p>
        <ol className="lost-registration-steps" aria-label="Etapas do cadastro">
          {steps.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined} data-complete={index < step}>
              <span aria-hidden="true">{index < step ? <FiCheck /> : index + 1}</span>
              {label}
              {index < step && <span className="visually-hidden"> concluída</span>}
            </li>
          ))}
        </ol>
        <form className="adoption-detail-panel lost-registration-panel" key={step} onSubmit={submit}>
          {step === 0 && (
            <>
              <fieldset className="lost-registration-type">
                <legend className="visually-hidden">Tipo de ocorrência</legend>
                {[['lost', 'Perdi um animal'], ['found', 'Encontrei um animal']].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="kind" value={value} className="visually-hidden" checked={kind === value} onChange={() => setKind(value)} />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="lost-registration-basic">
                {field({ name: 'name', label: found ? 'Nome do animal (opcional)' : 'Nome do animal', placeholder: 'Ex.: Bob', required: !found, pattern: String.raw`.*\S.*`, maxLength: 60 })}
                {field({ name: 'species', label: 'Espécie do animal', options: species, required: true })}
                {field({ name: 'breed', label: 'Raça (opcional)', placeholder: 'Ex.: São Bernardo', maxLength: 80 })}
                {field({ name: 'size', label: 'Porte do animal', options: sizes, required: true })}
                {field({ name: 'urgency', label: 'Urgência', options: urgencies, required: true })}
                {field({ name: 'sex', label: 'Sexo do animal', options: [...sexes, 'Não identificado'], required: true })}
              </div>
            </>
          )}
          {step === 1 && (
            <div className="lost-registration-columns">
              <div className="lost-registration-fields">
                <label>Descrição do animal<textarea className="form-control" name="description" rows={4} defaultValue={draft.description} placeholder="Ex.: Pelagem caramelo, coleira azul, atende por Bob" required maxLength={500} /></label>
                {field({ name: 'health', label: 'Saúde (opcional)', placeholder: 'Ex.: toma medicação diária', maxLength: 160 })}
                {field({ name: 'temperament', label: 'Temperamento (opcional)', placeholder: 'Ex.: dócil, tímido com estranhos', maxLength: 160 })}
                {field({ name: 'ageLabel', label: 'Idade estimada', options: ages, required: true })}
                <div className="lost-registration-status"><strong>Status do animal</strong><p>{found ? 'Encontrado' : 'Perdido'}</p></div>
              </div>
              <div className="lost-registration-fields">
                <PhotoPicker photos={photos} onChange={setPhotos} loading={loading} setLoading={setLoading} />
                {field({ name: 'phone', label: 'WhatsApp para contato', type: 'tel', placeholder: '(99) 99999-9999', autoComplete: 'tel-national', pattern: String.raw`(?:[0-9]{10,11}|\([0-9]{2}\) [0-9]{4,5}-[0-9]{4})`, title: 'Informe o DDD e o número, com 10 ou 11 dígitos.', maxLength: 20, onBlur: formatPhone, required: true })}
                {field({ name: 'contactName', label: 'Nome para contato', maxLength: 80, pattern: String.raw`.*\S.*`, autoComplete: 'name', required: true })}
                {field({ name: 'email', label: 'E-mail para contato (opcional)', type: 'email', autoComplete: 'email', maxLength: 120 })}
              </div>
            </div>
          )}
          {step === 2 && (
            <>
              <div className="lost-registration-columns">
                <div className="lost-registration-address">
                  {field({ name: 'cep', label: 'CEP (opcional)', inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '00000-000', pattern: '[0-9]{5}-?[0-9]{3}', onChange: lookup, onBlur: lookup, maxLength: 9 })}
                  {field({ name: 'date', label: 'Data da ocorrência', type: 'date', max: todayDate, required: true })}
                  <p className="lost-registration-wide mb-0" role="status" hidden={!cepMessage}>{cepMessage}</p>
                  {field({ name: 'street', label: 'Nome da rua (opcional)', placeholder: 'Ex.: Rua Ipanema', maxLength: 120, wide: true })}
                  {field({ name: 'neighborhood', label: 'Bairro', placeholder: 'Ex.: Jardim Satélite', pattern: String.raw`.*\S.*`, maxLength: 80, required: true })}
                  {field({ name: 'city', label: 'Cidade', pattern: String.raw`.*\S.*`, maxLength: 80, required: true })}
                  {field({ name: 'region', label: 'Estado', options: states, required: true })}
                  <label className="lost-registration-wide">Complemento (opcional)<textarea className="form-control" name="reference" rows={3} defaultValue={draft.reference} placeholder="Ponto de referência" maxLength={240} /></label>
                </div>
                <Suspense fallback={<p role="status">Carregando mapa…</p>}>
                  <OccurrenceMap point={point} location={mapLocation} loading={selection?.key !== locationKey && locating} error={selection?.key !== locationKey && mapError}
                    onRetry={retryMap} onChange={(next) => setSelection({ key: locationKey, point: next })} />
                </Suspense>
              </div>
              <p className="lost-registration-note">O anúncio e os dados de contato serão exibidos no mural público.</p>
            </>
          )}
          {error && <p className="text-danger mt-3 mb-0" role="alert">{error}</p>}
          <div className="lost-registration-actions">
            {step === 0 ? <Link className="adoption-control" to={state?.returnToOng ? ongAlertsPath : state?.returnToTutor ? tutorAnimalsPath : boardUrl}>Cancelar</Link> : (
              <button type="button" className="adoption-control" disabled={loading} onClick={(event) => back(event.currentTarget.form)}><FiChevronLeft aria-hidden="true" /> Voltar</button>
            )}
            <button type="submit" className="adoption-action" disabled={loading}>
              {step === 2 ? <><FiSend aria-hidden="true" /> {loading ? 'Publicando…' : 'Publicar'}</> : <>Próximo <FiChevronRight aria-hidden="true" /></>}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
