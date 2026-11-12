import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiHeart, FiMapPin, FiSearch } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import AdoptionFilterModal from './AdoptionFilterModal';
import { adoptionAnimals, filterFields, quickFilters } from './adoptionData';
import '@/styles/_adoption.scss';

const pageSize = 8;
const favoritesKey = 'patasphere:adoption-favorites';

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoritesKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

function AnimalTags({ animal }) {
  return (
    <ul className="adoption-tags" aria-label="Características">
      <li>Porte {animal.size.toLowerCase()}</li>
      <li>{animal.ageLabel}</li>
      <li>{animal.species}</li>
    </ul>
  );
}

function AnimalCard({ animal, favorite, onFavorite, detailsUrl }) {
  return (
    <article className="adoption-card">
      <div className="adoption-card-photo">
        <img src={animal.photo} alt={animal.name} />
        <span className="adoption-status" data-urgent={animal.urgent}>{animal.urgent ? 'Urgente' : 'Disponível'}</span>
        <button
          type="button"
          className="adoption-favorite"
          aria-pressed={favorite}
          aria-label={'Favoritar ' + animal.name}
          onClick={onFavorite}
        >
          <FiHeart aria-hidden="true" />
        </button>
      </div>
      <div className="adoption-card-body">
        <div className="adoption-card-title">
          <h2>{animal.name}</h2>
          <span data-female={animal.sex === 'Fêmea'}>
            <span aria-hidden="true">{animal.sex === 'Fêmea' ? '♀' : '♂'}</span> {animal.sex}
          </span>
        </div>
        <AnimalTags animal={animal} />
        <p>{animal.description}</p>
        <div className="adoption-card-footer">
          <div className="adoption-location">
            <FiMapPin aria-hidden="true" />
            <div><strong>{animal.organization}</strong>{animal.neighborhood}</div>
          </div>
          <Link to={detailsUrl} className="adoption-action" aria-label={'Quero adotar ' + animal.name} preventScrollReset>
            Quero adotar
          </Link>
        </div>
      </div>
    </article>
  );
}

function AdoptionDetails({ animal, onClose }) {
  return (
    <Modal show centered scrollable onHide={onClose} className="adoption-modal" aria-labelledby="adoption-details-title">
      <Modal.Header closeButton closeLabel="Fechar detalhes">
        <Modal.Title as="h2" id="adoption-details-title">Adote {animal.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <img className="adoption-detail-photo" src={animal.photo} alt={animal.name} />
        <AnimalTags animal={animal} />
        <p>{animal.description}</p>
        <p className="mb-2"><strong>{animal.organization}</strong> · {animal.neighborhood}, São José dos Campos</p>
        <p className="mb-0">Este perfil é demonstrativo. O contato para adoção será disponibilizado quando o cadastro da ONG estiver conectado ao mural.</p>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="adoption-control" onClick={onClose}>Voltar ao mural</button>
      </Modal.Footer>
    </Modal>
  );
}

export default function AdoptionBoard() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState(readFavorites);

  const heading = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch {
      // Favorites are still available during the current visit.
    }
  }, [favorites]);

  const filters = Object.fromEntries(filterFields.flatMap(([key, , options]) => {
    const value = params.get(key);
    return options.includes(value) ? [[key, value]] : [];
  }));
  if (params.has('urgent')) filters.urgent = true;
  if (params.has('puppy')) filters.puppy = true;

  const searchTerm = normalize(search.trim());
  const filtered = adoptionAnimals.filter((animal) =>
    normalize(animal.name).includes(searchTerm) &&
    Object.entries(filters).every(([key, value]) => animal[key] === value),
  );
  const pageCount = Math.ceil(filtered.length / pageSize);
  const requestedPage = Number.parseInt(params.get('pagina'), 10) || 1;
  const page = Math.max(1, Math.min(requestedPage, pageCount));
  const currentAnimals = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedAnimal = adoptionAnimals.find(({ id }) => String(id) === params.get('animal'));
  const activeFilter = quickFilters.find(([, criteria]) =>
    Object.keys(criteria).length === Object.keys(filters).length &&
    Object.entries(criteria).every(([key, value]) => filters[key] === value),
  )?.[0];

  function applyFilters(next) {
    const nextParams = new URLSearchParams(Object.entries(next));
    setParams(nextParams, { preventScrollReset: true });
    setFilterOpen(false);
  }

  function changeSearch(value) {
    setSearch(value);
    if (params.has('pagina')) {
      const nextParams = new URLSearchParams(params);
      nextParams.delete('pagina');
      setParams(nextParams, { replace: true, preventScrollReset: true });
    }
  }

  function changePage(next) {
    const nextParams = new URLSearchParams(params);
    nextParams.set('pagina', next);
    setParams(nextParams, { preventScrollReset: true });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }

  function closeDetails() {
    const nextParams = new URLSearchParams(params);
    nextParams.delete('animal');
    setParams(nextParams, { replace: true, preventScrollReset: true });
  }

  return (
    <section className="adoption-board" aria-labelledby="adoption-title">
      <div className="adoption-container">
        <h1 id="adoption-title" ref={heading} tabIndex={-1}>Adote um amigo</h1>
        <p className="adoption-intro">Animais disponíveis de todas as ONGs de São José dos Campos. Os casos urgentes aparecem primeiro.</p>
        <div className="adoption-search-row">
          <label className="adoption-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar pelo nome do animal"
              placeholder="Buscar pelo nome do animal"
              value={search}
              onChange={({ target }) => changeSearch(target.value)}
            />
          </label>
          <button type="button" className="adoption-control" onClick={() => setFilterOpen(true)}>
            <FiFilter aria-hidden="true" /> Filtros
          </button>
        </div>
        <div className="adoption-quick-filters" role="group" aria-label="Filtros rápidos">
          {quickFilters.map(([label, criteria]) => (
            <button key={label} type="button" className="adoption-control" aria-pressed={label === activeFilter} onClick={() => applyFilters(criteria)}>
              {label}
            </button>
          ))}
        </div>
        <p className="visually-hidden" role="status">{filtered.length} animais encontrados</p>
        {currentAnimals.length > 0 ? (
          <div className="adoption-grid">
            {currentAnimals.map((animal) => {
              const detailsParams = new URLSearchParams(params);
              detailsParams.set('animal', animal.id);
              return (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  favorite={favorites.includes(animal.id)}
                  onFavorite={() => setFavorites((current) => current.includes(animal.id)
                    ? current.filter((id) => id !== animal.id)
                    : [...current, animal.id])}
                  detailsUrl={'?' + detailsParams.toString()}
                />
              );
            })}
          </div>
        ) : (
          <div className="adoption-empty">
            <h2>Nenhum animal encontrado</h2>
            <button type="button" className="adoption-control" onClick={() => { setSearch(''); applyFilters({}); }}>Limpar busca e filtros</button>
          </div>
        )}
        {pageCount > 1 && (
          <nav className="adoption-pagination" aria-label="Paginação do mural">
            <span aria-live="polite">Página {page} de {pageCount}</span>
            <button type="button" className="adoption-control" disabled={page === 1} onClick={() => changePage(1)} aria-label="Primeira página"><FiChevronsLeft /></button>
            <button type="button" className="adoption-control" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label="Página anterior"><FiChevronLeft /></button>
            <button type="button" className="adoption-control" disabled={page === pageCount} onClick={() => changePage(page + 1)} aria-label="Próxima página"><FiChevronRight /></button>
            <button type="button" className="adoption-control" disabled={page === pageCount} onClick={() => changePage(pageCount)} aria-label="Última página"><FiChevronsRight /></button>
          </nav>
        )}
      </div>
      {filterOpen && <AdoptionFilterModal filters={filters} onApply={applyFilters} onClose={() => setFilterOpen(false)} />}
      {selectedAnimal && <AdoptionDetails animal={selectedAnimal} onClose={closeDetails} />}
    </section>
  );
}
