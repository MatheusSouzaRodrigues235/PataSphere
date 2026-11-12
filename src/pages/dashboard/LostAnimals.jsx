import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiCheck, FiEdit2, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import '@/styles/_ong-lost-animals.scss';

const kinds = { lost: 'Perdido', found: 'Encontrei' };
const statuses = { open: 'Aberto', reunited: 'Reencontrado', closed: 'Encerrado' };
const filters = { all: 'Todos', lost: 'Perdidos', found: 'Encontrados', closed: 'Encerrados' };
const titles = { add: 'Cadastrar animal perdido', edit: 'Editar anúncio', view: 'Ver anúncio', close: 'Encerrar caso', delete: 'Excluir anúncio' };
const displayName = (alert) => alert.name || 'Sem nome';

function AlertPhoto({ photo, alt = '' }) {
  const imageRef = useRef(null);

  useEffect(() => {
    if (!(photo instanceof File)) return;
    const url = URL.createObjectURL(photo);
    imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <span className="ong-alert-photo">
      {photo ? <img ref={imageRef} src={typeof photo === 'string' ? photo : undefined} alt={alt} /> : <LuPawPrint aria-hidden="true" />}
    </span>
  );
}

function AlertBadges({ alert }) {
  return (
    <div className="ong-alert-badges">
      <span data-tone={alert.kind} className="ong-alert-kind">{kinds[alert.kind]}</span>
      <span data-tone={alert.status}>{statuses[alert.status]}</span>
    </div>
  );
}

function AlertMetadata({ alert }) {
  return (
    <p className="ong-alert-meta">
      <span>{alert.place}</span>
      <time dateTime={alert.date}>{alert.date.split('-').reverse().join('/')}</time>
    </p>
  );
}

function AlertDialog({ dialog, dark, onDismiss, onApply }) {
  const { type, alert } = dialog;
  const editing = type === 'add' || type === 'edit';

  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (editing) {
      const place = data.get('place').trim();
      if (!place) {
        form.elements.place.setCustomValidity('Informe o bairro ou local.');
        form.elements.place.reportValidity();
        return;
      }
      const file = data.get('photo');
      onApply({
        name: data.get('name').trim(),
        kind: data.get('kind'),
        place,
        date: data.get('date'),
        description: data.get('description').trim(),
        photo: file.name ? file : alert?.photo,
      });
    } else {
      onApply({ status: data.get('status') });
    }
  }

  return (
    <Modal show centered scrollable onHide={onDismiss} aria-labelledby="ong-alert-dialog-title"
      data-bs-theme={dark ? 'dark' : 'light'} className="ong-animal-modal ong-alert-modal">
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title id="ong-alert-dialog-title" as="h2">{titles[type]}</Modal.Title>
      </Modal.Header>
      <form onSubmit={submit} className="ong-alert-form">
        <Modal.Body>
          {editing && (
            <div className="ong-alert-fields">
              <label>Tipo de anúncio
                <select name="kind" className="form-select" defaultValue={alert?.kind ?? 'lost'}>
                  {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Nome do animal
                <input name="name" className="form-control" defaultValue={alert?.name} placeholder="Se souber" maxLength={100} />
              </label>
              <label>Bairro ou local
                <input name="place" className="form-control" defaultValue={alert?.place} required maxLength={150}
                  onInput={(event) => event.currentTarget.setCustomValidity('')} />
              </label>
              <label>Data do ocorrido
                <input type="date" name="date" className="form-control" defaultValue={alert?.date} required />
              </label>
              <label>Descrição
                <textarea name="description" className="form-control" defaultValue={alert?.description} rows={3} maxLength={2000} />
              </label>
              {alert?.photo && <AlertPhoto photo={alert.photo} alt={displayName(alert)} />}
              <label>{alert?.photo ? 'Substituir foto' : 'Foto do animal'}
                <input type="file" name="photo" className="form-control" accept="image/*"
                  onChange={(event) => {
                    const input = event.currentTarget;
                    const file = input.files[0];
                    input.setCustomValidity(file && !file.type.startsWith('image/') ? 'Selecione um arquivo de imagem.' : '');
                  }} />
              </label>
            </div>
          )}
          {type === 'view' && (
            <div className="ong-alert-details">
              <AlertPhoto photo={alert.photo} alt={displayName(alert)} />
              <AlertBadges alert={alert} />
              <h3>{displayName(alert)}</h3>
              <AlertMetadata alert={alert} />
              {alert.description && <p>{alert.description}</p>}
            </div>
          )}
          {type === 'close' && (
            <label>Como terminou o caso de {displayName(alert)}?
              <select name="status" className="form-select" defaultValue="reunited">
                <option value="reunited">Animal reencontrado</option>
                <option value="closed">Encerrado sem reencontro</option>
              </select>
            </label>
          )}
          {type === 'delete' && <p>Deseja excluir o anúncio de <strong>{displayName(alert)}</strong>?</p>}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="ong-button" onClick={onDismiss}>{type === 'view' ? 'Fechar' : 'Cancelar'}</button>
          {type !== 'view' && (
            <button type="submit" className="ong-button ong-primary">
              {editing ? 'Salvar anúncio' : type === 'close' ? 'Encerrar caso' : 'Excluir anúncio'}
            </button>
          )}
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default function LostAnimals({ alerts, setAlerts, dark }) {
  const [filter, setFilter] = useState('all');
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const results = alerts.filter((alert) => filter === 'all'
    || (filter === 'closed' ? alert.status !== 'open' : alert.status === 'open' && alert.kind === filter));

  function apply(values) {
    const { type, alert } = dialog;
    if (type === 'add') {
      const newAlert = { ...values, id: crypto.randomUUID(), status: 'open' };
      setAlerts((current) => [newAlert, ...current]);
      setFilter('all');
      setMessage('Anúncio cadastrado.');
    } else if (type === 'delete') {
      setAlerts((current) => current.filter(({ id }) => id !== alert.id));
      setMessage('Anúncio excluído.');
    } else {
      setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, ...values } : item));
      setMessage(type === 'close' ? 'Caso encerrado.' : 'Alterações salvas.');
    }
    setDialog(null);
  }

  return (
    <main className="ong-main ong-lost-animals">
      <div className="ong-title">
        <div>
          <h1>Animais perdidos</h1>
          <p>Alertas de perdidos e encontrados publicados pela ONG</p>
        </div>
        <button type="button" className="ong-button ong-primary" onClick={() => setDialog({ type: 'add' })}>
          <FiPlus aria-hidden="true" /> Cadastrar animal perdido
        </button>
      </div>

      <div className="ong-alert-filters" role="group" aria-label="Filtrar anúncios">
        {Object.entries(filters).map(([value, label]) => (
          <button key={value} type="button" className="ong-button" aria-pressed={filter === value}
            onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>

      {results.length ? (
        <ul className="ong-alert-list" aria-label="Anúncios">
          {results.map((alert) => (
            <li className="ong-alert-card" key={alert.id}>
              <AlertPhoto photo={alert.photo} />
              <div className="ong-alert-info">
                <AlertBadges alert={alert} />
                <h2>{displayName(alert)}</h2>
                <AlertMetadata alert={alert} />
              </div>
              <div className="ong-alert-actions" role="group" aria-label={`Ações do anúncio de ${displayName(alert)}`}>
                {alert.status === 'open' ? (
                  <>
                    <button type="button" className="ong-button" onClick={() => setDialog({ type: 'edit', alert })}>
                      <FiEdit2 aria-hidden="true" /> Editar
                    </button>
                    <button type="button" className="ong-button ong-alert-close" onClick={() => setDialog({ type: 'close', alert })}>
                      <FiCheck aria-hidden="true" /> Encerrar caso
                    </button>
                  </>
                ) : (
                  <button type="button" className="ong-button" onClick={() => setDialog({ type: 'view', alert })}>
                    <FiEye aria-hidden="true" /> Ver anúncio
                  </button>
                )}
                <button type="button" className="ong-button ong-alert-delete" aria-label={`Excluir anúncio de ${displayName(alert)}`}
                  onClick={() => setDialog({ type: 'delete', alert })}>
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="ong-empty">Nenhum anúncio neste filtro.</p>}

      <div role="status" className="visually-hidden">{message}</div>
      {dialog && <AlertDialog dialog={dialog} dark={dark} onDismiss={() => setDialog(null)} onApply={apply} />}
    </main>
  );
}
