import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

export default function AdoptionFilterModal({ filters, onApply, onClose, fields, toggles = [], dateRange }) {
  const [draft, setDraft] = useState(filters);
  const dateError = dateRange?.validate(draft);

  return (
    <Modal show onHide={onClose} centered scrollable className="adoption-modal" aria-labelledby="adoption-filter-title">
      <Modal.Header closeButton closeLabel="Fechar filtros">
        <Modal.Title as="h2" id="adoption-filter-title">Filtros</Modal.Title>
      </Modal.Header>
      <Modal.Body className="adoption-filter-fields">
        {fields.map(([key, label, options]) => (
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
        {dateRange && <fieldset className="d-grid gap-2">
          <legend className="fs-6">Data da ocorrência</legend>
          {Object.entries({ de: 'Data inicial', ate: 'Data final' }).map(([key, label]) => (
            <label key={key}>
              {label}
              <input type="date" className="form-control" value={draft[key] ?? ''}
                aria-invalid={Boolean(dateError)} aria-describedby={dateError ? 'occurrence-date-error' : undefined}
                onChange={({ target }) => setDraft({ ...draft, [key]: target.value })} />
            </label>
          ))}
          {dateError && <p id="occurrence-date-error" role="alert" className="text-danger mb-0">{dateError}</p>}
        </fieldset>}
        {toggles.map(([key, label]) => (
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
          disabled={Boolean(dateError)}
          onClick={() => onApply(Object.fromEntries(Object.entries(draft).filter(([, value]) => value)))}
        >
          Aplicar filtros
        </button>
      </Modal.Footer>
    </Modal>
  );
}
