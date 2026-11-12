import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { LuArrowLeftRight, LuPawPrint, LuPencil } from 'react-icons/lu';
import { statuses } from '../animals';
import AnimalFilterModal from '../AnimalFilterModal';
import { matchesAnimalFilters } from '../animalFilters';
import AnimalManagementModal from './AnimalManagementModal';
import '@/styles/_ong-animal-management.scss';

const urgencyTones = { Alta: 'red', Média: 'orange', Baixa: 'muted' };
const normalize = (value) => value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');

export default function AnimalManagement({ animals, setAnimals, dark }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');

  const search = normalize(query);
  const results = animals.filter((animal) =>
    [animal.name, animal.status].some((value) => normalize(value).includes(search))
    && matchesAnimalFilters(animal, filters),
  );
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const closeDialog = () => setDialog(null);

  function applyFilters(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function selectStatus(status) {
    const nextFilters = { ...filters };
    if (status) nextFilters.status = status;
    else delete nextFilters.status;
    applyFilters(nextFilters);
  }

  function saveAnimal(values) {
    if (dialog.type === 'add') {
      const animal = {
        ...values,
        id: crypto.randomUUID(),
        status: statuses[0].label,
        medicalCare: false,
        registeredAt: new Date().toLocaleDateString('pt-BR'),
      };
      setAnimals((current) => [animal, ...current]);
      setQuery('');
      applyFilters({});
      setMessage(`${animal.name} foi cadastrado.`);
    } else {
      setAnimals((current) => current.map((animal) =>
        animal.id === dialog.animal.id ? { ...animal, ...values } : animal,
      ));
      setPage(currentPage);
      setMessage(dialog.type === 'status' ? 'Status atualizado.' : 'Alterações salvas.');
    }
    closeDialog();
  }

  function deleteAnimal() {
    setAnimals((current) => current.filter((animal) => animal.id !== dialog.animal.id));
    setPage(Math.min(currentPage, Math.max(1, Math.ceil((results.length - 1) / pageSize))));
    setMessage(`${dialog.animal.name} foi removido.`);
    closeDialog();
  }

  return (
    <main className="ong-main ong-animal-management">
      <div className="ong-title">
        <div>
          <h1>Animais</h1>
          <p>Gerencie os animais cadastrados para adoção pela sua ONG</p>
        </div>
        <button type="button" className="ong-button ong-primary" onClick={() => setDialog({ type: 'add' })}>
          <FiPlus aria-hidden="true" /> Cadastrar animal
        </button>
      </div>

      <div className="ong-controls">
        <label className="ong-search">
          <FiSearch aria-hidden="true" />
          <span className="visually-hidden">Buscar por nome ou status</span>
          <input type="search" placeholder="Buscar por nome ou status" value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </label>
        <button type="button" className="ong-button" onClick={() => setDialog({ type: 'filters' })}>
          <FiFilter aria-hidden="true" /> {Object.keys(filters).some((key) => key !== 'status') ? 'Filtros ativos' : 'Filtros'}
        </button>
      </div>

      <div className="ong-animal-statuses" role="group" aria-label="Filtrar por status">
        {[{ tab: 'Todos' }, ...statuses].map(({ label, tab }) => (
          <button key={tab} type="button" className="ong-button" aria-pressed={filters.status === label}
            onClick={() => selectStatus(label)}>{tab}</button>
        ))}
      </div>

      <div className="ong-animal-table">
        <div className="table-responsive" role="region" aria-label="Lista de animais" tabIndex={0}>
          <table aria-label="Animais cadastrados">
            <thead><tr>
              {['Animal', 'Status', 'Urgência', 'Cadastrado em', 'Ações'].map((label) => (
                <th key={label} scope="col">{label}</th>
              ))}
            </tr></thead>
            <tbody>
              {results.slice(start, start + pageSize).map((animal) => (
                <tr key={animal.id}>
                  <th scope="row">
                    <div className="ong-animal-cell">
                      <span className="ong-animal-thumbnail">
                        {animal.photo ? <img src={animal.photo} alt="" /> : <LuPawPrint aria-hidden="true" />}
                      </span>
                      <span>
                        <strong>{animal.name}</strong>
                        <small>{[animal.species === 'Gato' && animal.sex === 'Fêmea' ? 'Gata' : animal.species,
                          animal.ageLabel || animal.age, animal.size].filter(Boolean).join(' · ')}</small>
                      </span>
                    </div>
                  </th>
                  <td><span className="ong-animal-badge" data-tone={statuses.find(({ label }) => label === animal.status)?.tone}>{animal.status}</span></td>
                  <td><span className="ong-animal-badge" data-tone={urgencyTones[animal.urgency]}>{animal.urgency}</span></td>
                  <td>{animal.registeredAt}</td>
                  <td>
                    <div className="ong-animal-actions">
                      {[
                        { type: 'status', label: 'Alterar status de', Icon: LuArrowLeftRight },
                        { type: 'edit', label: 'Editar', Icon: LuPencil },
                        { type: 'delete', label: 'Excluir', Icon: FiTrash2 },
                      ].map(({ type, label, Icon }) => (
                        <button key={type} type="button" className="ong-icon" aria-label={`${label} ${animal.name}`}
                          title={`${label} ${animal.name}`} onClick={() => setDialog({ type, animal })}>
                          <Icon aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!results.length && <tr><td colSpan={5} className="ong-animal-no-results">Nenhum animal encontrado.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="ong-animal-pagination">
          <label>Linhas por página
            <select className="form-select" value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              {[8, 16, 24].map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <span aria-live="polite">{results.length ? `${start + 1}–${Math.min(start + pageSize, results.length)}` : '0'} de {results.length}</span>
          <button type="button" className="ong-button" aria-label="Página anterior" disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}><FiChevronLeft aria-hidden="true" /></button>
          <button type="button" className="ong-button" aria-label="Próxima página" disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}><FiChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <div role="status" className="visually-hidden">{message}</div>

      {dialog?.type === 'filters' ? (
        <AnimalFilterModal filters={filters} animals={animals} dark={dark} onClose={closeDialog}
          onApply={(nextFilters) => { applyFilters(nextFilters); closeDialog(); }} />
      ) : dialog && (
        <AnimalManagementModal dialog={dialog} dark={dark} onClose={closeDialog} onSave={saveAnimal} onDelete={deleteAnimal} />
      )}
    </main>
  );
}
