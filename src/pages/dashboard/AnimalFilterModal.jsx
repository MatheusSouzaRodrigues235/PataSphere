import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiCheck, FiChevronRight, FiX } from 'react-icons/fi';
import { filterGroups } from './animalFilters';
import '@/styles/_ong-filters.scss';

export default function AnimalFilterModal({ filters, dark, onApply, onClose, animals }) {
  const [draft, setDraft] = useState(filters);
  const [expanded, setExpanded] = useState(null);
  const optionsRef = useRef(null);

  useEffect(() => {
    if (expanded) optionsRef.current?.focus();
  }, [expanded]);

  function changeCriterion(key, value) {
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
      onHide={onClose}
      scrollable
      className="ong-filter-modal"
      backdropClassName="ong-filter-backdrop"
      data-bs-theme={dark ? 'dark' : 'light'}
      aria-labelledby="ong-filter-title"
      aria-describedby="ong-filter-description"
    >
      <Modal.Header>
        <div>
          <Modal.Title as="h2" id="ong-filter-title">Filtros</Modal.Title>
          <p id="ong-filter-description">Escolha os critérios para refinar a lista de animais.</p>
        </div>
        <button type="button" className="ong-filter-close" onClick={onClose} aria-label="Fechar filtros">
          <FiX aria-hidden="true" />
        </button>
      </Modal.Header>

      <Modal.Body>
        {filterGroups.map(({ label, color, criteria }) => {
          const criterion = criteria.find(({ key }) => key === expanded);
          const options = animals && ['breed', 'color', 'traits'].includes(criterion?.key)
            ? [...new Set([...animals.flatMap((animal) => animal[criterion.key] || []), draft[criterion.key]].filter(Boolean))]
            : criterion?.options;
          return (
            <section key={label} className="ong-filter-group" data-color={color}>
              <h3>{label}</h3>
              <div className="ong-filter-grid">
                {criteria.map(({ key, label: title, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className="ong-filter-tile"
                    data-selected={Boolean(draft[key])}
                    aria-expanded={key === expanded}
                    aria-controls={key === expanded ? 'ong-filter-options' : undefined}
                    aria-label={draft[key] ? `${title}, selecionado` : undefined}
                    onClick={() => setExpanded(key === expanded ? null : key)}
                  >
                    {draft[key] && <span className="ong-filter-check"><FiCheck aria-hidden="true" /></span>}
                    <span className="ong-filter-icon"><Icon aria-hidden="true" /></span>
                    {title}
                  </button>
                ))}
              </div>
              {criterion && (
                <label id="ong-filter-options" className="ong-filter-options">
                  {criterion.label}
                  <select
                    ref={optionsRef}
                    className="form-select"
                    value={draft[criterion.key] ?? ''}
                    onChange={(event) => changeCriterion(criterion.key, event.target.value)}
                  >
                    <option value="">Qualquer opção</option>
                    {options.map((option) => {
                      const [value, text] = Array.isArray(option) ? option : [option, option];
                      return <option key={value} value={value}>{text}</option>;
                    })}
                  </select>
                </label>
              )}
            </section>
          );
        })}
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="ong-filter-clear" onClick={() => { setDraft({}); setExpanded(null); }}>
          Limpar tudo
        </button>
        <button type="button" className="ong-button ong-primary" onClick={() => onApply(draft)}>
          Filtrar <FiChevronRight aria-hidden="true" />
        </button>
      </Modal.Footer>
    </Modal>
  );
}
