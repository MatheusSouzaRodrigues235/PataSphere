import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiArrowLeft, FiLink, FiMapPin } from 'react-icons/fi';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { formatAlertDate, lostAnimalsPath, todayDate } from './lostAnimalsData';

function SightingModal({ name, onClose }) {
  const [submitted, setSubmitted] = useState(false);

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <Modal show centered scrollable onHide={onClose} className="adoption-modal lost-modal" aria-labelledby="sighting-title">
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title as="h2" id="sighting-title">Você viu {name}?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitted ? (
          <p role="status" className="mb-0">Avistamento simulado. Nenhuma mensagem foi enviada ao responsável.</p>
        ) : (
          <form id="sighting-form" className="lost-form" onSubmit={submit}>
            <label className="lost-form-wide">Onde você viu o animal?<input className="form-control" name="place" placeholder="Bairro, rua ou ponto de referência" required maxLength={160} /></label>
            <label>Data do avistamento<input className="form-control" type="date" name="date" required max={todayDate} /></label>
            <label>Seu nome<input className="form-control" name="name" required maxLength={80} /></label>
            <label className="lost-form-wide">Seu telefone (opcional)<input className="form-control" name="phone" type="tel" maxLength={20} /></label>
            <label className="lost-form-wide">Observações (opcional)<textarea className="form-control" name="notes" rows={3} maxLength={500} /></label>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="adoption-control" onClick={onClose}>{submitted ? 'Fechar' : 'Cancelar'}</button>
        {!submitted && <button type="submit" form="sighting-form" className="adoption-action">Registrar avistamento</button>}
      </Modal.Footer>
    </Modal>
  );
}

function LostAnimalProfile({ animal, boardUrl }) {
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = new URL(lostAnimalsPath + '/' + animal.id, window.location.origin).href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setModal('share');
    }
  }

  return (
    <div className="adoption-board lost-detail">
      <div className="adoption-container">
        <Link to={boardUrl} className="adoption-control lost-back"><FiArrowLeft aria-hidden="true" /> Voltar à vitrine</Link>
        <div className="lost-detail-grid">
          <section className="lost-panel lost-summary" aria-labelledby="lost-detail-title">
            <span className="lost-status">Perdido</span>
            <h1 id="lost-detail-title">{animal.name}</h1>
            <p className="lost-last-seen"><FiMapPin aria-hidden="true" /> {animal.neighborhood}, {animal.city}</p>
            <ul className="adoption-tags" aria-label="Características">
              {[animal.sex, 'Porte ' + animal.size.toLowerCase(), animal.ageLabel].filter(Boolean).map((label) => <li key={label}>{label}</li>)}
            </ul>
            <dl className="lost-facts">
              <div><dt>Espécie</dt><dd>{animal.species}</dd></div>
              {animal.breed && <div><dt>Raça</dt><dd>{animal.breed}</dd></div>}
              <div><dt>Data do desaparecimento</dt><dd><time dateTime={animal.date}>{formatAlertDate(animal.date)}</time></dd></div>
            </dl>
            <div className="lost-detail-actions">
              <button type="button" className="adoption-action" onClick={() => setModal('sighting')}>Informar avistamento</button>
              {animal.example && <button type="button" className="adoption-control" onClick={copyLink}><FiLink aria-hidden="true" /> {copied ? 'Link copiado' : 'Copiar link'}</button>}
              <span className="visually-hidden" role="status">{copied && 'Link copiado para a área de transferência.'}</span>
            </div>
          </section>
          <div className="lost-panel lost-detail-photo"><img src={animal.photo} alt={animal.name} /></div>
        </div>
        <section className="lost-panel">
          <h2>Sobre o desaparecimento</h2>
          <p className="mb-0">{animal.description}</p>
        </section>
        <section className="lost-panel">
          <h2>Contato do responsável</h2>
          {animal.example ? (
            <p className="mb-0">Este é um alerta de exemplo.</p>
          ) : (
            <>
              <p className="mb-1">{animal.contactName}</p>
              <a href={'tel:' + animal.phone.replace(/[^+0-9]/g, '')}>{animal.phone}</a>
            </>
          )}
        </section>
      </div>
      {modal === 'sighting' && <SightingModal name={animal.name} onClose={() => setModal(null)} />}
      {modal === 'share' && (
        <Modal show centered onHide={() => setModal(null)} className="adoption-modal" aria-labelledby="lost-share-title">
          <Modal.Header closeButton closeLabel="Fechar"><Modal.Title as="h2" id="lost-share-title">Compartilhar alerta</Modal.Title></Modal.Header>
          <Modal.Body><label className="w-100">Link do alerta<input className="form-control" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label></Modal.Body>
        </Modal>
      )}
    </div>
  );
}

export default function LostAnimalPage() {
  const { alerts } = useOutletContext();
  const { animalId } = useParams();
  const { state } = useLocation();
  const animal = alerts.find(({ id }) => id === animalId);
  const boardUrl = { pathname: lostAnimalsPath, search: state?.boardSearch ?? '' };

  if (animal) return <LostAnimalProfile key={animal.id} animal={animal} boardUrl={boardUrl} />;

  return (
    <div className="adoption-board">
      <div className="adoption-container adoption-empty">
        <h1>Alerta indisponível</h1>
        <Link to={lostAnimalsPath} className="adoption-control">Voltar à vitrine</Link>
      </div>
    </div>
  );
}
