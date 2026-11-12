import Modal from 'react-bootstrap/Modal';

export default function AdoptionDetailModal({ animal, kind, shareUrl, onClose }) {
  const organization = kind === 'organization';

  return (
    <Modal show centered onHide={onClose} className="adoption-modal" aria-labelledby="adoption-detail-modal-title">
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title as="h2" id="adoption-detail-modal-title">
          {organization ? 'ONG responsável' : 'Compartilhar perfil'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {organization ? (
          <>
            <h3 className="h5">{animal.organization}</h3>
            <p>São José dos Campos – SP</p>
            <p className="mb-0">ONG responsável pelo perfil de {animal.name}. O contato será disponibilizado quando o cadastro da ONG estiver conectado ao mural.</p>
          </>
        ) : (
          <label className="d-block">
            Link do animal
            <input className="form-control mt-1" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
          </label>
        )}
      </Modal.Body>
    </Modal>
  );
}
