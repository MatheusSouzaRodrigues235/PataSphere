import { useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter, FiMapPin, FiSearch } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import AdoptionFilterModal from '@/pages/adoption/AdoptionFilterModal';
import { useOrganizations } from './organizationApi';
import { ongAdoptionSearch, ongProfilePath } from './ongProfiles';

const pageSize = 6;
const filterToggles = [['disponiveis', 'Somente ONGs com animais para adoção']];

function normalize(value) {
  return value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

function OngCard({ ong }) {
  const { available } = ong;
  const location = [ong.neighborhood, ong.city].filter(Boolean).join(' · ');
  return (
    <article className="ong-public-panel ong-directory-card">
      <div className="ong-directory-identity">
        <span className="ong-directory-avatar" aria-hidden="true">{ong.logo ? <img src={ong.logo} alt="" loading="lazy" /> : ong.name[0]}</span>
        <div><h2>{ong.name}</h2>{ong.tagline && <p>{ong.tagline}</p>}</div>
      </div>
      {location && <p className="ong-directory-location">
        <FiMapPin aria-hidden="true" /> {location}
      </p>}
      <span className="ong-directory-count" data-available={available > 0}>
        {available === 1 ? '1 animal para adoção' : available + ' animais para adoção'}
      </span>
      <div className="ong-directory-actions">
        <Link className="adoption-control ong-directory-profile" to={ongProfilePath(ong)} aria-label={'Ver perfil de ' + ong.name}>
          Ver perfil
        </Link>
        <Link className="adoption-control" to={'/adocao?' + ongAdoptionSearch(ong)} aria-label={'Ver animais de ' + ong.name}>
          Ver animais
        </Link>
      </div>
    </article>
  );
}

export default function OngDirectory() {
  const [params, setParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const heading = useRef(null);
  const search = params.get('busca') ?? '';
  const neighborhood = params.get('bairro');
  const availableOnly = params.has('disponiveis');
  const term = normalize(search);
  const { data, loading, error, reload } = useOrganizations();
  const organizations = data?.organizations ?? [];
  const neighborhoods = [...new Set(organizations.map(({ neighborhood }) => neighborhood).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'pt-BR'));
  const filterFields = [['bairro', 'Bairro', neighborhoods]];
  const results = organizations.filter((ong) => (
    normalize(ong.name).includes(term) &&
    (!neighborhood || ong.neighborhood === neighborhood) &&
    (!availableOnly || ong.available > 0)
  ));
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1));
  const entries = results.slice((page - 1) * pageSize, page * pageSize);

  function updateParams(values, options) {
    const next = new URLSearchParams(params);
    next.delete('pagina');
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, options);
  }

  function changePage(nextPage) {
    updateParams({ pagina: nextPage > 1 ? nextPage : null });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView();
  }

  return (
    <section className="adoption-container ong-directory-page" aria-labelledby="ong-directory-title">
      <h1 id="ong-directory-title" tabIndex={-1} ref={heading}>ONGs cadastradas</h1>
      <p className="adoption-intro">Conheça as organizações que cuidam dos animais e veja como ajudar.</p>
      <div className="adoption-search-row">
        <label className="adoption-search">
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Buscar ONG pelo nome" aria-label="Buscar ONG pelo nome" value={search}
            onChange={({ target }) => updateParams({ busca: target.value }, { replace: true })} />
        </label>
        <button className="adoption-control" type="button" aria-haspopup="dialog" onClick={() => setFilterOpen(true)}>
          <FiFilter aria-hidden="true" /> {neighborhood || availableOnly ? 'Filtros ativos' : 'Filtros'}
        </button>
      </div>
      <p className="visually-hidden" role="status">{results.length} ONGs encontradas</p>
      {loading ? <p role="status">Carregando ONGs…</p> : error ? (
        <div className="adoption-empty ong-directory-empty">
          <p role="alert">{error}</p>
          <button type="button" className="adoption-control" onClick={reload}>Tentar novamente</button>
        </div>
      ) : entries.length > 0 ? (
        <div className="ong-directory">
          {entries.map((ong) => <OngCard key={ong.accountId} ong={ong} />)}
        </div>
      ) : (
        <div className="adoption-empty ong-directory-empty">
          <h2>{organizations.length ? 'Nenhuma ONG encontrada' : 'Nenhuma ONG cadastrada'}</h2>
          {organizations.length > 0 && <button type="button" className="adoption-control" onClick={() => setParams({})}>Limpar busca e filtros</button>}
        </div>
      )}
      {pageCount > 1 && (
        <nav className="adoption-pagination" aria-label="Paginação de ONGs">
          <span aria-live="polite">Página {page} de {pageCount}</span>
          <button type="button" className="adoption-control" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label="Página anterior">
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="adoption-control" disabled={page === pageCount} onClick={() => changePage(page + 1)} aria-label="Próxima página">
            <FiChevronRight aria-hidden="true" />
          </button>
        </nav>
      )}
      {filterOpen && (
        <AdoptionFilterModal
          filters={{ bairro: neighborhood, disponiveis: availableOnly }}
          fields={filterFields}
          toggles={filterToggles}
          onClose={() => setFilterOpen(false)}
          onApply={({ bairro, disponiveis }) => {
            updateParams({ bairro, disponiveis });
            setFilterOpen(false);
          }}
        />
      )}
    </section>
  );
}
