import Modal from 'react-bootstrap/Modal';

export default function AdoptionDetailModal({ shareUrl, onClose }) {
  return (
    <Modal show centered onHide={onClose} className="adoption-modal" aria-labelledby="adoption-detail-modal-title">
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title as="h2" id="adoption-detail-modal-title">
          Compartilhar perfil
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <label className="d-block">
          Link do animal
          <input className="form-control mt-1" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
        </label>
      </Modal.Body>
    </Modal>
  );
}
