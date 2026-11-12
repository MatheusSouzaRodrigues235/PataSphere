import { useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiMapPin, FiPlus, FiSearch } from 'react-icons/fi';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import AdoptionFilterModal from '@/pages/adoption/AdoptionFilterModal';
import LostAnimalForm from './LostAnimalForm';
import { animalFields, lostAnimalsPath, timeSince, todayDate } from './lostAnimalsData';

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
  return (
    <article className="adoption-card lost-card">
      <div className="adoption-card-photo">
        <img src={animal.photo} alt={animal.name} loading="lazy" />
        <span className="lost-status">Perdido</span>
      </div>
      <div className="adoption-card-body">
        <div className="adoption-card-title">
          <h2>{animal.name}</h2>
          <span><span aria-hidden="true">{animal.sex === 'Fêmea' ? '♀' : '♂'}</span> {animal.sex}</span>
        </div>
        <ul className="adoption-tags" aria-label="Características">
          {['Porte ' + animal.size.toLowerCase(), animal.ageLabel, animal.species].filter(Boolean).map((label) => <li key={label}>{label}</li>)}
        </ul>
        <p>Visto pela última vez em {animal.neighborhood}. {animal.description}</p>
        <div className="adoption-card-footer">
          <span className="adoption-location"><FiMapPin aria-hidden="true" /> <time dateTime={animal.date}>{timeSince(animal.date)}</time></span>
          <Link to={lostAnimalsPath + '/' + animal.id} state={{ boardSearch }} className="adoption-action" aria-label={'Ver detalhes de ' + animal.name}>Ver detalhes</Link>
        </div>
      </div>
    </article>
  );
}

export default function LostAnimalsBoard() {
  const { alerts, addAlert } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState(null);
  const heading = useRef(null);
  const search = params.get('busca') ?? '';
  const neighborhoods = [...new Set(alerts.map(({ neighborhood }) => neighborhood))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const cities = [...new Set(alerts.map(({ city }) => city))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const fields = [...animalFields, ['city', 'Cidade', cities], ['neighborhood', 'Bairro', neighborhoods]];
  const filters = Object.fromEntries(fields.flatMap(([key, , options]) => {
    const value = params.get(key);
    return options.includes(value) ? [[key, value]] : [];
  }));
  if (params.has('recent')) filters.recent = true;

  const term = normalize(search.trim());
  const filtered = alerts.filter((animal) =>
    normalize(animal.name).includes(term) &&
    Object.entries(filters).every(([key, value]) => key === 'recent'
      ? Date.parse(todayDate) - Date.parse(animal.date) <= 7 * 86_400_000
      : animal[key] === value),
  ).sort((a, b) => b.date.localeCompare(a.date));

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(1, Math.min(Number.parseInt(params.get('pagina'), 10) || 1, pageCount));

  function applyFilters(criteria, query = search) {
    const next = new URLSearchParams(Object.entries(criteria));
    if (query) next.set('busca', query);
    setParams(next, { preventScrollReset: true });
    setModal(null);
  }

  function changeSearch(value) {
    const next = new URLSearchParams(params);
    next.delete('pagina');
    if (value) next.set('busca', value);
    else next.delete('busca');
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
            <h1 id="lost-title" ref={heading} tabIndex={-1}>Animais perdidos</h1>
            <p className="adoption-intro" role="status">{filtered.length} {filtered.length === 1 ? 'animal esperando' : 'animais esperando'} para voltar para casa</p>
          </div>
          <button type="button" className="adoption-action lost-add" onClick={() => setModal('add')}>
            <FiPlus aria-hidden="true" /> Adicionar um animal
          </button>
        </div>
        <div className="adoption-search-row">
          <label className="adoption-search">
            <FiSearch aria-hidden="true" />
            <input type="search" aria-label="Buscar pelo nome do animal" placeholder="Buscar pelo nome do animal" value={search} onChange={({ target }) => changeSearch(target.value)} />
          </label>
          <button type="button" className="adoption-control" onClick={() => setModal('filters')}><FiFilter aria-hidden="true" /> Filtros</button>
        </div>
        <div className="adoption-quick-filters" role="group" aria-label="Filtros rápidos">
          {quickFilters.map(([label, criteria]) => (
            <button type="button" key={label} className="adoption-control"
              aria-pressed={Object.keys(criteria).length === Object.keys(filters).length && Object.entries(criteria).every(([key, value]) => filters[key] === value)}
              onClick={() => applyFilters(criteria)}>
              {label}
            </button>
          ))}
        </div>
        {filtered.length ? (
          <div className="adoption-grid">
            {filtered.slice((page - 1) * pageSize, page * pageSize).map((animal) => (
              <LostAnimalCard key={animal.id} animal={animal} boardSearch={params.toString()} />
            ))}
          </div>
        ) : (
          <div className="adoption-empty">
            <h2>Nenhum animal encontrado</h2>
            <button type="button" className="adoption-control" onClick={() => applyFilters({}, '')}>Limpar busca e filtros</button>
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
        <AdoptionFilterModal filters={filters} fields={fields} toggles={[[ 'recent', 'Somente os últimos 7 dias' ]]}
          onClose={() => setModal(null)} onApply={applyFilters} />
      )}
      {modal === 'add' && <LostAnimalForm onClose={() => setModal(null)} onAdd={(animal) => {
        addAlert(animal);
        applyFilters({}, '');
      }} />}
    </section>
  );
}
