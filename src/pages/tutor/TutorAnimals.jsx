import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FiCalendar, FiCheck, FiEdit2, FiEye, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatAlertDate, lostAnimalsPath, todayDate } from '@/pages/lost-animals/lostAnimalsData';
import { TutorConfirm } from './TutorSections';


const filters = [
  ['Todos', () => true],
  ['Perdidos', (animal) => !animal.closed && animal.kind !== 'found'],
  ['Encontrados', (animal) => !animal.closed && animal.kind === 'found'],
  ['Encerrados', (animal) => animal.closed],
];

function AnimalCard({ animal, onAction }) {
  const found = animal.kind === 'found';
  return (
    <li className="tutor-animal-card" data-closed={Boolean(animal.closed)}>
      <div className="tutor-animal-summary">
        <img src={animal.photos?.[0] ?? animal.photo} alt="" loading="lazy" />
        <div>
          <div className="tutor-animal-badges">
            <span data-tone={found ? 'green' : 'red'}>{found ? 'Encontrei' : 'Perdido'}</span>
            <span data-tone={animal.closed ? 'gray' : 'green'}>
              {animal.closed ? (found ? 'Encerrado' : 'Reencontrado') : 'Aberto'}
            </span>
          </div>
          <h2>{animal.name}</h2>
          <div className="tutor-animal-meta">
            <span><FiMapPin aria-hidden="true" />{animal.neighborhood}</span>
            <time dateTime={animal.date}><FiCalendar aria-hidden="true" />{formatAlertDate(animal.date)}</time>
          </div>
        </div>
      </div>
      <div className="tutor-animal-actions">
        {animal.closed ? (
          <Link to={lostAnimalsPath + '/' + animal.id} state={{ returnToTutor: true }}>
            <FiEye aria-hidden="true" /> Ver anúncio<span className="visually-hidden"> de {animal.name}</span>
          </Link>
        ) : (
          <>
            <button type="button" onClick={() => onAction('edit', animal)}>
              <FiEdit2 aria-hidden="true" /> Editar<span className="visually-hidden"> {animal.name}</span>
            </button>
            <button className="tutor-animal-dark" type="button" onClick={() => onAction('close', animal)}>
              <FiCheck aria-hidden="true" /> Encerrar caso<span className="visually-hidden"> de {animal.name}</span>
            </button>
          </>
        )}
        <button type="button" className="tutor-animal-delete" aria-label={'Excluir anúncio de ' + animal.name}
          onClick={() => onAction('delete', animal)}><FiTrash2 aria-hidden="true" /></button>
      </div>
    </li>
  );
}

function EditAlert({ animal, close, submit, error }) {
  return (
    <Modal show centered onHide={close} aria-labelledby="tutor-edit-animal">
      <form className="tutor-dialog" onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        submit({ ...animal, ...Object.fromEntries([...fields].map(([key, value]) => [key, value.trim()])) });
      }}>
        <Modal.Header closeButton closeLabel="Fechar">
          <Modal.Title id="tutor-edit-animal">Editar anúncio de {animal.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="tutor-field">
            <label htmlFor="tutor-animal-name">Nome</label>
            <input id="tutor-animal-name" name="name" defaultValue={animal.name} maxLength={80}
              pattern=".*\S.*" required autoFocus />
          </div>
          <div className="tutor-columns">
            <div className="tutor-field">
              <label htmlFor="tutor-animal-neighborhood">Bairro</label>
              <input id="tutor-animal-neighborhood" name="neighborhood" defaultValue={animal.neighborhood}
                maxLength={80} pattern=".*\S.*" required />
            </div>
            <div className="tutor-field">
              <label htmlFor="tutor-animal-date">Data da ocorrência</label>
              <input id="tutor-animal-date" name="date" type="date" defaultValue={animal.date}
                max={animal.date > todayDate ? animal.date : todayDate} required />
            </div>
          </div>
          <div className="tutor-field">
            <label htmlFor="tutor-animal-description">Descrição</label>
            <textarea id="tutor-animal-description" name="description" defaultValue={animal.description}
              maxLength={500} rows={3} />
          </div>
          {error && <p className="tutor-error mb-0" role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={close}>Cancelar</Button>
          <Button type="submit">Salvar alterações</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default function TutorAnimals({ alerts, save }) {
  const [filter, setFilter] = useState(0);
  const [action, setAction] = useState(null);
  const [error, setError] = useState('');
  const visible = alerts.filter(filters[filter][1]).sort((a, b) => b.date.localeCompare(a.date));
  const cancel = () => { setAction(null); setError(''); };

  function commit(next, message) {
    if (save({ alerts: next }, message)) cancel();
    else setError('Não foi possível salvar a alteração neste navegador.');
  }

  function replace(updated, message) {
    commit(alerts.map((animal) => animal.id === updated.id ? updated : animal), message);
  }

  const removing = action?.type === 'delete';
  return (
    <div className="tutor-body tutor-animals">
      <div className="tutor-animal-filters" role="group" aria-label="Filtrar ocorrências">
        {filters.map(([label], index) => (
          <button type="button" key={label} aria-pressed={filter === index} onClick={() => setFilter(index)}>
            {label}
          </button>
        ))}
      </div>
      {visible.length ? (
        <ul className="tutor-animal-list" aria-label="Anúncios cadastrados">
          {visible.map((animal) => <AnimalCard key={animal.id} animal={animal}
            onAction={(type, selected) => setAction({ type, animal: selected })} />)}
        </ul>
      ) : (
        <div className="tutor-animal-empty">
          <p>{alerts.length ? 'Nenhum anúncio neste filtro.' : 'Você ainda não cadastrou nenhum anúncio.'}</p>
          {alerts.length > 0 && <button type="button" onClick={() => setFilter(0)}>Ver todos</button>}
        </div>
      )}
      {action?.type === 'edit' && <EditAlert animal={action.animal} close={cancel} error={error}
        submit={(updated) => replace(updated, 'Anúncio atualizado.')} />}
      {action && action.type !== 'edit' && (
        <TutorConfirm title={removing ? 'Excluir anúncio' : 'Encerrar caso'}
          confirm={removing ? 'Excluir anúncio' : 'Encerrar caso'} close={cancel} action={() => {
            if (removing) commit(alerts.filter((animal) => animal.id !== action.animal.id), 'Anúncio excluído.');
            else replace({ ...action.animal, closed: true }, 'Caso encerrado.');
          }}>
          {removing
            ? <>O anúncio de <strong>{action.animal.name}</strong> será removido deste navegador.</>
            : <>O anúncio de <strong>{action.animal.name}</strong> sairá da vitrine e ficará disponível em Encerrados.</>}
          {error && <p className="tutor-error mt-2 mb-0" role="alert">{error}</p>}
        </TutorConfirm>
      )}
    </div>
  );
}
