import { useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiMapPin, FiPlus, FiSearch } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import AddressSearch from '@/components/layout/AddressSearch';
import { locationSearch } from '@/app/locationSearch';
import AdoptionFilterModal from '@/pages/adoption/AdoptionFilterModal';
import { useLostAnimals } from './lostAnimalsApi';
import { matchesOccurrenceDate, occurrenceDateError } from './occurrenceDates';
import { animalFields, formatAlertDate, lostAnimalsPath, timeSince, todayDate } from './lostAnimalsData';

const pageSize = 8;
const quickFilters = [
  ['Todos', {}], ['Cães', { species: 'Cão' }], ['Gatos', { species: 'Gato' }],
  ...animalFields[1][2].map((size) => ['Porte ' + size.toLowerCase(), { size }]),
  ['Mais recentes', { recent: true }],
];

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

function LostAnimalCard({ animal, boardSearch }) {
  const found = animal.kind === 'found';
  return (
    <article className="adoption-card lost-card">
      <div className="adoption-card-photo">
        <img src={animal.photos?.[0] ?? animal.photo} alt={animal.name} loading="lazy" />
        <span className="lost-status" data-found={found}>{found ? 'Encontrado' : 'Perdido'}</span>
      </div>
      <div className="adoption-card-body">
        <div className="adoption-card-title">
          <h2>{animal.name}</h2>
          <span><span aria-hidden="true">{{ 'Fêmea': '♀', Macho: '♂' }[animal.sex]}</span> {animal.sex}</span>
        </div>
        <ul className="adoption-tags" aria-label="Características">
          {['Porte ' + animal.size.toLowerCase(), animal.ageLabel, animal.species].filter(Boolean).map((label) => <li key={label}>{label}</li>)}
        </ul>
        <p>{found ? 'Encontrado em' : 'Visto pela última vez em'} {animal.neighborhood}. {animal.description}</p>
        <div className="adoption-card-footer">
          <span className="adoption-location"><FiMapPin aria-hidden="true" /> <time dateTime={animal.date}>{timeSince(animal.date)}</time></span>
          <Link to={lostAnimalsPath + '/' + animal.id} state={{ boardSearch }} className="adoption-action" aria-label={'Ver detalhes de ' + animal.name}>Ver detalhes</Link>
        </div>
      </div>
    </article>
  );
}

export default function LostAnimalsBoard() {
  const { data, loading, error, reload } = useLostAnimals('', { live: true });
  const alerts = data?.alerts ?? [];
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState(null);
  const heading = useRef(null);
  const found = params.get('tipo') === 'encontrados';
  const search = params.get('busca') ?? '';
  const address = params.get('endereco') ?? '';
  const matchesAddress = locationSearch(address);
  const neighborhoods = [...new Set(alerts.map(({ neighborhood }) => neighborhood))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const cities = [...new Set(alerts.map(({ city }) => city))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const fields = [...animalFields, ['city', 'Cidade', cities], ['neighborhood', 'Bairro', neighborhoods]];
  const filters = Object.fromEntries(fields.flatMap(([key, , options]) => {
    const value = params.get(key);
    return options.includes(value) ? [[key, value]] : [];
  }));
  if (params.has('recent')) filters.recent = true;
  const dateFilters = { de: params.get('de') ?? '', ate: params.get('ate') ?? '' };
  const dateError = occurrenceDateError(dateFilters);
  const activeDates = !dateError && (dateFilters.de || dateFilters.ate);
  const draft = dateError ? filters : { ...filters, ...dateFilters };
  const otherType = new URLSearchParams(params);
  otherType.delete('pagina');
  if (found) otherType.delete('tipo');
  else otherType.set('tipo', 'encontrados');

  const term = normalize(search.trim());
  const filtered = alerts.filter((animal) =>
    (animal.kind === 'found') === found &&
    normalize(animal.name).includes(term) && matchesAddress(animal) &&
    matchesOccurrenceDate(animal.date, { ...(activeDates ? dateFilters : {}), recent: filters.recent }, todayDate) &&
    Object.entries(filters).every(([key, value]) => key === 'recent' || animal[key] === value),
  ).sort((a, b) => b.date.localeCompare(a.date));

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(1, Math.min(Number.parseInt(params.get('pagina'), 10) || 1, pageCount));

  function applyFilters(criteria, query = search, location = address) {
    const next = new URLSearchParams(Object.entries(criteria).filter(([, value]) => value));
    if (found) next.set('tipo', 'encontrados');
    if (query) next.set('busca', query);
    if (location) next.set('endereco', location);
    setParams(next, { preventScrollReset: true });
    setModal(null);
  }

  function clearDates() {
    const next = new URLSearchParams(params);
    ['de', 'ate', 'pagina'].forEach((key) => next.delete(key));
    setParams(next, { preventScrollReset: true });
  }

  function changeSearch(key, value) {
    const next = new URLSearchParams(params);
    next.delete('pagina');
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(params);
    next.set('pagina', nextPage);
    setParams(next, { preventScrollReset: true });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <section className="adoption-board lost-board" aria-labelledby="lost-title">
      <div className="adoption-container">
        <div className="lost-board-heading">
          <div>
            <h1 id="lost-title" ref={heading} tabIndex={-1}>{found ? 'Animais encontrados' : 'Animais perdidos'}</h1>
            <p className="adoption-intro" role="status">{filtered.length} {filtered.length === 1 ? 'alerta' : 'alertas'}</p>
          </div>
          <Link to={lostAnimalsPath + '/cadastro'} state={{ boardSearch: params.toString() }} className="adoption-action lost-add">
            <FiPlus aria-hidden="true" /> Adicionar um animal
          </Link>
        </div>
        <div className="adoption-search-row">
          <label className="adoption-search">
            <FiSearch aria-hidden="true" />
            <input type="search" aria-label="Buscar pelo nome do animal" placeholder="Buscar pelo nome do animal" value={search} onChange={({ target }) => changeSearch('busca', target.value)} />
          </label>
          <button type="button" className="adoption-control" aria-haspopup="dialog" onClick={() => setModal('filters')}><FiFilter aria-hidden="true" /> Filtros</button>
        </div>
        <AddressSearch label="Buscar pelo endereço da ocorrência" placeholder="CEP, rua, bairro ou cidade da ocorrência"
          value={address} onChange={(value) => changeSearch('endereco', value)} />
        <div className="adoption-quick-filters" role="group" aria-label="Filtros rápidos">
          <Link className="adoption-control lost-type-link" to={{ pathname: lostAnimalsPath, search: otherType.toString() }}>
            {found ? 'Ver animais perdidos' : 'Ver animais encontrados'}
          </Link>
          {quickFilters.map(([label, criteria]) => (
            <button type="button" key={label} className="adoption-control"
              aria-pressed={Object.keys(criteria).length === Object.keys(filters).length && Object.entries(criteria).every(([key, value]) => filters[key] === value)}
              onClick={() => applyFilters({ ...criteria, ...(activeDates ? dateFilters : {}) })}>
              {label}
            </button>
          ))}
        </div>
        {(activeDates || dateError) && <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          {dateError ? <span role="alert">{dateError}</span> : <span>
            Período da ocorrência {dateFilters.de && <>desde {formatAlertDate(dateFilters.de)}</>}
            {dateFilters.de && dateFilters.ate && ' '}
            {dateFilters.ate && <>até {formatAlertDate(dateFilters.ate)}</>}
          </span>}
          <button type="button" className="adoption-control" onClick={clearDates}>Remover período</button>
        </div>}
        {loading && <p role="status">Carregando anúncios…</p>}
        {error && <p role="alert">{error} <button type="button" className="adoption-control" onClick={reload}>Tentar novamente</button></p>}
        {filtered.length ? (
          <div className="adoption-grid">
            {filtered.slice((page - 1) * pageSize, page * pageSize).map((animal) => (
              <LostAnimalCard key={animal.id} animal={animal} boardSearch={params.toString()} />
            ))}
          </div>
        ) : !loading && !error && (
          <div className="adoption-empty">
            <h2>Nenhum animal encontrado</h2>
            <button type="button" className="adoption-control" onClick={() => applyFilters({}, '', '')}>Limpar busca e filtros</button>
          </div>
        )}
        {pageCount > 1 && (
          <nav className="adoption-pagination" aria-label="Paginação da vitrine">
            <span aria-live="polite">Página {page} de {pageCount}</span>
            {[
              ['Primeira página', FiChevronsLeft, 1, page === 1],
              ['Página anterior', FiChevronLeft, page - 1, page === 1],
              ['Próxima página', FiChevronRight, page + 1, page === pageCount],
              ['Última página', FiChevronsRight, pageCount, page === pageCount],
            ].map(([label, Icon, target, disabled]) => (
              <button type="button" key={label} className="adoption-control" aria-label={label} disabled={disabled} onClick={() => changePage(target)}><Icon aria-hidden="true" /></button>
            ))}
          </nav>
        )}
      </div>
      {modal === 'filters' && (
        <AdoptionFilterModal filters={draft} fields={fields} dateRange={{ validate: occurrenceDateError }} toggles={[['recent', 'Somente os últimos 7 dias']]}
          onClose={() => setModal(null)} onApply={applyFilters} />
      )}
    </section>
  );
}
