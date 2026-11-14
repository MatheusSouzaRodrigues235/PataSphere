import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiX } from 'react-icons/fi';
import { filterGroups } from './adoptionData';
import '@/styles/_adoption-board-filter.scss';

export default function AdoptionBoardFilterModal({ filters, neighborhoods, countMatches, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const count = countMatches(draft);
  const resultLabel = count === 1 ? '1 animal' : count + ' animais';

  function updateCriterion(key, value) {
    setDraft((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  return (
    <Modal
      show
      scrollable
      onHide={onClose}
      className="adoption-board-filter"
      backdropClassName="adoption-board-filter-backdrop"
      aria-labelledby="adoption-board-filter-title"
      aria-describedby="adoption-board-filter-description"
    >
      <Modal.Header>
        <div>
          <Modal.Title as="h2" id="adoption-board-filter-title">Filtros</Modal.Title>
          <p id="adoption-board-filter-description">Refine a lista de animais para adoção.</p>
        </div>
        <button type="button" className="adoption-board-filter-close" aria-label="Fechar filtros" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </Modal.Header>
      <Modal.Body>
        {filterGroups.map(([key, label, options]) => (
          <fieldset key={key}>
            <legend>{label}</legend>
            <div className="adoption-board-filter-options">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="adoption-control"
                  aria-pressed={draft[key] === option}
                  onClick={() => updateCriterion(key, draft[key] === option ? '' : option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="adoption-board-filter-location">
          Local
          <select className="form-select" value={draft.neighborhood ?? ''} onChange={({ target }) => updateCriterion('neighborhood', target.value)}>
            <option value="">Todos os locais</option>
            {neighborhoods.map((neighborhood) => <option key={neighborhood}>{neighborhood}</option>)}
          </select>
        </label>
        <label className="adoption-board-filter-puppy">
          <input
            type="checkbox"
            className="form-check-input"
            checked={Boolean(draft.puppy)}
            onChange={({ target }) => updateCriterion('puppy', target.checked)}
          />
          Somente filhotes
        </label>
      </Modal.Body>
      <Modal.Footer>
        <span role="status" className="visually-hidden">{count === 0 ? 'Nenhum animal encontrado' : resultLabel + ' na lista'}</span>
        <button type="button" className="adoption-control" onClick={() => setDraft({})}>Limpar tudo</button>
        <button type="button" className="adoption-action" onClick={() => onApply(draft)}>Ver {resultLabel}</button>
      </Modal.Footer>
    </Modal>
  );
}
