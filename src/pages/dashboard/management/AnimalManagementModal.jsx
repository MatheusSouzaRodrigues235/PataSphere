import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiAlertTriangle, FiPlus, FiX } from 'react-icons/fi';
import { ages, sexes, sizes, species, statuses, urgencies } from '../animals';

const fields = [
  ['name', 'Nome'],
  ['species', 'Espécie', species],
  ['breed', 'Raça'],
  ['color', 'Cor'],
  ['size', 'Porte', sizes],
  ['age', 'Idade', ages],
  ['sex', 'Sexo', sexes],
  ['urgency', 'Urgência', urgencies],
  ['health', 'Saúde'],
  ['temperament', 'Temperamento'],
];

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AnimalForm({ animal, onSave, onBusyChange, saving, connected }) {
  const [photos, setPhotos] = useState(() => animal?.photos ?? (animal?.photo ? [animal.photo] : []));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function addPhotos(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;
    if (connected && (photos.length + files.length > 4 || files.some(({ size }) => size > 3 * 1024 * 1024))) {
      setError('Envie até 4 fotos de no máximo 3 MB cada.');
      return;
    }
    if (files.some(({ type }) => !['image/jpeg', 'image/png'].includes(type))) {
      setError('Selecione fotos no formato JPG ou PNG.');
      return;
    }
    setError('');
    setLoading(true);
    onBusyChange(true);
    try {
      const images = await Promise.all(files.map(readPhoto));
      setPhotos((current) => [...current, ...images]);
    } catch {
      setError('Não foi possível abrir as fotos. Tente selecionar os arquivos novamente.');
    } finally {
      setLoading(false);
      onBusyChange(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (loading || saving) return;
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries([...data].map(([key, value]) => [key, value.trim()]));
    if (!values.name) {
      const name = event.currentTarget.elements.namedItem('name');
      name.value = '';
      name.reportValidity();
      return;
    }
    if (connected) {
      onSave({ ...values, photos: photos.map((photo) => photo.startsWith('data:') ? photo : photo.split('/').at(-1)) });
      return;
    }
    onSave({
      ...values,
      ageLabel: values.age === animal?.age ? animal.ageLabel : undefined,
      traits: [...new Set(values.temperament.split(',').map((trait) => trait.trim()).filter(Boolean))],
      photos,
      photo: photos[0],
    });
  }

  return (
    <form id="ong-animal-modal-form" onSubmit={submit} className="ong-animal-form">
      {fields.map(([key, label, options]) => (
        <label key={key}>
          {label}
          {options ? (
            <select name={key} className="form-select" defaultValue={animal?.[key] ?? ''} required>
              <option value="" disabled>Selecione</option>
              {options.map((option) => <option key={option}>{option}</option>)}
            </select>
          ) : (
            <input className="form-control" name={key} required={key === 'name'}
              maxLength={key === 'name' ? 60 : 120}
              defaultValue={animal?.[key] ?? (key === 'temperament' ? animal?.traits?.join(', ') : '')} />
          )}
        </label>
      ))}
      <label className="ong-animal-form-wide">
        Descrição
        <textarea className="form-control" name="description" rows={3} maxLength={1500} defaultValue={animal?.description} />
      </label>
      <fieldset className="ong-animal-form-wide">
        <legend>{connected ? 'Fotos (até 4 JPG ou PNG, 3 MB cada)' : 'Fotos (JPG ou PNG)'}</legend>
        <div className="ong-animal-photos">
          {photos.map((photo, index) => (
            <div key={index} className="ong-animal-form-photo">
              <img src={photo} alt={`Foto ${index + 1} do animal`} />
              <button type="button" disabled={saving || loading} aria-label={`Remover foto ${index + 1}`}
                onClick={() => setPhotos((current) => current.filter((_, position) => position !== index))}>
                <FiX aria-hidden="true" />
              </button>
            </div>
          ))}
          <label className="ong-animal-add-photo">
            <input type="file" className="visually-hidden" accept="image/jpeg,image/png" multiple
              disabled={saving || loading} onChange={addPhotos} />
            <span className="visually-hidden">Adicionar fotos</span>
            <FiPlus aria-hidden="true" />
          </label>
        </div>
        {loading && <p role="status">Carregando fotos…</p>}
        {error && <p role="alert" className="text-danger">{error}</p>}
      </fieldset>
    </form>
  );
}

export default function AnimalManagementModal({ dialog, dark, onClose, onSave, onDelete, connected }) {
  const { type, animal } = dialog;
  const [status, setStatus] = useState(animal?.status);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [publicationKey] = useState(() => type === 'add' && connected ? crypto.randomUUID() : undefined);
  const close = () => { if (!saving && !busy) onClose(); };

  async function persist(action) {
    if (saving || busy) return;
    setSaving(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  function save(values) {
    persist(() => onSave({ ...values, key: publicationKey }));
  }
  const title = {
    add: 'Cadastrar animal',
    edit: 'Editar animal',
    status: `Alterar status de ${animal?.name}`,
    delete: 'Excluir este animal?',
  }[type];
  const description = {
    add: 'Preencha as informações do animal para o mural de adoção.',
    edit: 'Atualize as informações exibidas no mural de adoção.',
    status: 'Escolha a nova situação do animal.',
  }[type];

  return (
    <Modal show onHide={close} centered scrollable className="ong-animal-modal"
      dialogClassName={`ong-animal-dialog-${type}`} backdropClassName="ong-animal-backdrop"
      data-bs-theme={dark ? 'dark' : 'light'} aria-labelledby="ong-animal-modal-title"
      aria-describedby="ong-animal-modal-description">
      {type === 'delete' ? (
        <Modal.Body className="ong-animal-delete">
          <span className="ong-animal-delete-icon"><FiAlertTriangle aria-hidden="true" /></span>
          <Modal.Title as="h2" id="ong-animal-modal-title">{title}</Modal.Title>
          <p id="ong-animal-modal-description">
            O cadastro de <strong>{animal.name}</strong> e suas fotos serão removidos da lista. Esta ação não pode ser desfeita.
          </p>
          {error && <p role="alert" className="text-danger">{error}</p>}
          <div className="ong-animal-delete-actions">
            <button type="button" className="ong-button" onClick={close} disabled={saving || busy}>Cancelar</button>
            <button type="button" className="ong-button ong-primary ong-animal-danger" disabled={saving} onClick={() => persist(onDelete)}>Sim, excluir</button>
          </div>
        </Modal.Body>
      ) : (
        <>
          <Modal.Header>
            <div>
              <Modal.Title as="h2" id="ong-animal-modal-title">{title}</Modal.Title>
              <p id="ong-animal-modal-description">{description}</p>
            </div>
            <button type="button" className="ong-icon ong-animal-close" aria-label="Fechar" onClick={close} disabled={saving || busy}>
              <FiX aria-hidden="true" />
            </button>
          </Modal.Header>
          <Modal.Body>
            {type === 'status' ? (
              <form id="ong-animal-modal-form" onSubmit={(event) => {
                event.preventDefault();
                save({ status });
              }}>
                <fieldset className="ong-animal-status-options">
                  <legend className="visually-hidden">Novo status</legend>
                  {statuses.map(({ label, detail }) => (
                    <label key={label}>
                      <input type="radio" name="status" value={label} checked={status === label} onChange={() => setStatus(label)} />
                      <span><strong>{label}</strong><small>{detail}</small></span>
                    </label>
                  ))}
                </fieldset>
                <p className="ong-animal-status-warning">
                  <FiAlertTriangle aria-hidden="true" />
                  Ao marcar como “Adotado”, o animal deixa de aparecer no mural de adoção.
                </p>
              </form>
            ) : <AnimalForm animal={animal} onSave={save} onBusyChange={setBusy} saving={saving} connected={connected} />}
            {error && <p role="alert" className="text-danger">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="ong-button" onClick={close} disabled={saving || busy}>Cancelar</button>
            <button type="submit" className="ong-button ong-primary" form="ong-animal-modal-form" disabled={busy || saving}>
              {{ add: 'Cadastrar animal', edit: 'Salvar alterações', status: 'Salvar status' }[type]}
            </button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
