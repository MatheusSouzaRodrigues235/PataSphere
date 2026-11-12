import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { NavLink, useMatch } from 'react-router-dom';
import {
  FiBell, FiFilter, FiGrid, FiHeart, FiMoon, FiPlus, FiSearch, FiSun,
} from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { initialAnimals, sexes, sizes, traits } from './animals';
import AnimalFilterModal from './AnimalFilterModal';
import { matchesAnimalFilters } from './animalFilters';
import Donations from './donations/Donations';
import AnimalManagement from './management/AnimalManagement';

const emptyFilters = {};

function normalizeName(value) {
  return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

function SearchField({ label, value, onChange, className = '' }) {
  return (
    <label className={`ong-search ${className}`}>
      <FiSearch aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
      <input type="search" placeholder={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AnimalDetails({ animal }) {
  return (
    <>
      <div className="ong-animal-heading">
        <h2>{animal.name}</h2>
        <span className={animal.sex === 'Fêmea' ? 'ong-female' : 'ong-male'}>
          <span aria-hidden="true">{animal.sex === 'Fêmea' ? '♀' : '♂'}</span> {animal.sex}
        </span>
      </div>
      <p>Porte {animal.size.toLocaleLowerCase('pt-BR')}</p>
      <div className="ong-traits">
        {animal.traits.map((trait) => <span key={trait} data-trait={trait}>{trait}</span>)}
      </div>
    </>
  );
}

function AnimalPhoto({ animal }) {
  return (
    <div className="ong-animal-photo">
      {animal.photo ? <img src={animal.photo} alt={animal.name} /> : <LuPawPrint aria-hidden="true" />}
      {animal.medicalCare && <span className="ong-medical"><FiPlus aria-hidden="true" /> Cuidados médicos</span>}
    </div>
  );
}

function SelectField({ name, label, options }) {
  return (
    <label className="form-label d-block">
      {label}
      <select className="form-select" name={name} required>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function OngDashboard() {
  const donations = Boolean(useMatch('/dashboard/ong/doacoes'));
  const management = Boolean(useMatch('/dashboard/ong/animais'));
  const overview = !donations && !management;
  const [animals, setAnimals] = useState(initialAnimals);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [dialog, setDialog] = useState(null);
  const [dark, setDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const results = animals.filter((animal) =>
    normalizeName(animal.name).includes(normalizeName(query))
    && matchesAnimalFilters(animal, filters),
  );
  const hasFilters = Object.keys(filters).length > 0;
  const closeDialog = () => setDialog(null);

  function applyFilters(nextFilters) {
    setFilters(nextFilters);
    closeDialog();
  }

  function addAnimal(event) {
    event.preventDefault();
    const nameInput = event.currentTarget.elements.namedItem('name');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.value = '';
      nameInput.reportValidity();
      return;
    }
    const data = new FormData(event.currentTarget);
    const animal = {
      id: crypto.randomUUID(),
      name,
      sex: data.get('sex'),
      size: data.get('size'),
      age: 'Não informada',
      urgency: 'Baixa',
      registeredAt: new Date().toLocaleDateString('pt-BR'),
      status: data.has('medicalCare') ? 'Em tratamento' : 'Disponível',
      medicalCare: data.has('medicalCare'),
      traits: data.getAll('traits'),
    };
    setAnimals((current) => [animal, ...current]);
    setQuery('');
    setFilters(emptyFilters);
    closeDialog();
  }

  return (
    <div className="ong-dashboard" data-bs-theme={dark ? 'dark' : 'light'}>
      <aside className="ong-sidebar">
        <div className="ong-brand"><span aria-hidden="true">P</span> PataSphere</div>
        <nav aria-label="Páginas do dashboard">
          <p>Páginas</p>
          <ul>
            <li><NavLink to="/dashboard/ong" end><FiGrid aria-hidden="true" /> Visão geral</NavLink></li>
            <li><NavLink to="/dashboard/ong/doacoes"><FiHeart aria-hidden="true" /> Doações</NavLink></li>
            <li><NavLink to="/dashboard/ong/animais"><LuPawPrint aria-hidden="true" /> Animais</NavLink></li>
            <li><span aria-disabled="true"><FiSearch aria-hidden="true" /> Animais perdidos</span></li>
          </ul>
        </nav>
      </aside>

      <div className="ong-workspace">
        <header className="ong-topbar">
          <div className="ong-breadcrumb">Dashboards <span aria-hidden="true">/</span> <strong>{management ? 'Animais' : donations ? 'Doações' : 'Visão geral'}</strong></div>
          <div className="ong-tools">
            {overview && <SearchField className="ong-top-search" label="Buscar" value={query} onChange={setQuery} />}
            <div className="ong-notifications">
              <button type="button" className="ong-icon" aria-label="Notificações" aria-expanded={showNotifications}
                onClick={() => setShowNotifications((current) => !current)}>
                <FiBell aria-hidden="true" />
              </button>
              {showNotifications && <p role="status">Nenhuma notificação.</p>}
            </div>
            <button type="button" className="ong-icon" aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
              onClick={() => setDark((current) => !current)}>
              {dark ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div hidden={!donations}><Donations dark={dark} /></div>
        {management && <AnimalManagement animals={animals} setAnimals={setAnimals} dark={dark} />}
        <main id="visao-geral" className="ong-main" hidden={!overview}>
          <div className="ong-title">
            <div>
              <h1>Seus animais</h1>
              <p>Gerencie os animais cadastrados pela sua ONG</p>
            </div>
            <button type="button" className="ong-button ong-primary" onClick={() => setDialog({ type: 'add' })}>
              <FiPlus aria-hidden="true" /> Adicionar um animal
            </button>
          </div>

          <div className="ong-controls">
            <SearchField label="Buscar pelo nome do animal" value={query} onChange={setQuery} />
            <button type="button" className="ong-button" onClick={() => setDialog({ type: 'filters' })}>
              <FiFilter aria-hidden="true" /> {hasFilters ? 'Filtros ativos' : 'Filtros'}
            </button>
          </div>

          {results.length ? (
            <div className="ong-animal-grid">
              {results.map((animal) => (
                <article key={animal.id} className="ong-animal">
                  <AnimalPhoto animal={animal} />
                  <div className="ong-animal-body">
                    <AnimalDetails animal={animal} />
                    <button type="button" className="ong-button" aria-label={`Ver perfil de ${animal.name}`}
                      onClick={() => setDialog({ type: 'profile', animal })}>
                      Ver perfil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="ong-empty" role="status">Nenhum animal encontrado.</p>}
        </main>
      </div>

      {dialog?.type === 'filters' ? (
        <AnimalFilterModal filters={filters} animals={animals} dark={dark} onApply={applyFilters} onClose={closeDialog} />
      ) : (
        <Modal show={Boolean(dialog)} onHide={closeDialog} centered data-bs-theme={dark ? 'dark' : 'light'}
          aria-labelledby="ong-dialog-title">
          <Modal.Header closeButton closeLabel="Fechar">
            <Modal.Title id="ong-dialog-title">
              {{ add: 'Adicionar um animal', profile: 'Perfil do animal' }[dialog?.type]}
            </Modal.Title>
          </Modal.Header>
          {dialog?.type === 'add' && (
            <form onSubmit={addAnimal}>
              <Modal.Body>
                <label className="form-label d-block">Nome <input className="form-control" name="name" required maxLength={60} /></label>
                <SelectField name="sex" label="Sexo" options={sexes} />
                <SelectField name="size" label="Porte" options={sizes} />
                <fieldset className="mb-2">
                  <legend className="fs-6">Características</legend>
                  {traits.map((trait) => (
                    <label key={trait} className="me-3"><input type="checkbox" name="traits" value={trait} /> {trait}</label>
                  ))}
                </fieldset>
                <label><input type="checkbox" name="medicalCare" /> Precisa de cuidados médicos</label>
              </Modal.Body>
              <Modal.Footer><button type="submit" className="btn btn-primary">Adicionar animal</button></Modal.Footer>
            </form>
          )}
          {dialog?.type === 'profile' && (
            <Modal.Body className="ong-profile">
              <AnimalPhoto animal={dialog.animal} />
              <AnimalDetails animal={dialog.animal} />
            </Modal.Body>
          )}
        </Modal>
      )}
    </div>
  );
}
