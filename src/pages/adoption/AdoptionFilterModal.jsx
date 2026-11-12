import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { filterFields } from './adoptionData';

export default function AdoptionFilterModal({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);

  return (
    <Modal show onHide={onClose} centered scrollable className="adoption-modal" aria-labelledby="adoption-filter-title">
      <Modal.Header closeButton closeLabel="Fechar filtros">
        <Modal.Title as="h2" id="adoption-filter-title">Filtros</Modal.Title>
      </Modal.Header>
      <Modal.Body className="adoption-filter-fields">
        {filterFields.map(([key, label, options]) => (
          <label key={key}>
            {label}
            <select
              className="form-select"
              value={draft[key] ?? ''}
              onChange={({ target }) => setDraft({ ...draft, [key]: target.value })}
            >
              <option value="">Qualquer opção</option>
              {options.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ))}
        {[['urgent', 'Somente casos urgentes'], ['puppy', 'Somente filhotes']].map(([key, label]) => (
          <label key={key} className="adoption-checkbox">
            <input
              type="checkbox"
              className="form-check-input"
              checked={Boolean(draft[key])}
              onChange={({ target }) => setDraft({ ...draft, [key]: target.checked })}
            />
            {label}
          </label>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="adoption-control" onClick={() => setDraft({})}>Limpar filtros</button>
        <button
          type="button"
          className="adoption-action"
          onClick={() => onApply(Object.fromEntries(Object.entries(draft).filter(([, value]) => value)))}
        >
          Aplicar filtros
        </button>
      </Modal.Footer>
    </Modal>
  );
}
