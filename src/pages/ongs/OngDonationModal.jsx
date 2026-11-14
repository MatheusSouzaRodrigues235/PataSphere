import { useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiCopy, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function OngDonationModal({ ong, show, onClose }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [goToContact, setGoToContact] = useState(false);
  const pixInput = useRef(null);
  const navigate = useNavigate();

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(ong.pixKey);
      setCopyStatus('Chave Pix copiada.');
    } catch {
      pixInput.current?.focus();
      pixInput.current?.select();
      setCopyStatus('Chave selecionada. Use o comando de copiar do seu dispositivo.');
    }
  }

  function finishClosing() {
    setCopyStatus('');
    if (goToContact) {
      setGoToContact(false);
      navigate('#contato');
    }
  }

  return (
    <Modal
      show={show}
      onHide={onClose}
      onExited={finishClosing}
      restoreFocus={!goToContact}
      centered
      scrollable
      className="ong-donation-modal"
      backdropClassName="ong-donation-backdrop"
      aria-labelledby="ong-donation-title"
      aria-describedby="ong-donation-description"
    >
      <Modal.Header closeButton closeLabel="Fechar janela">
        <div>
          <Modal.Title as="h2" id="ong-donation-title">Como doar para a {ong.name}</Modal.Title>
          <p id="ong-donation-description">Sua ajuda vai direto para a ONG e contribui para o cuidado dos animais.</p>
        </div>
      </Modal.Header>
      <Modal.Body>
        {ong.pixKey && <div className="ong-donation-pix">
          <label htmlFor="ong-donation-key">Chave Pix</label>
          <div className="ong-donation-key">
            <input id="ong-donation-key" ref={pixInput} value={ong.pixKey} readOnly />
            <button className="adoption-control" type="button" onClick={copyPixKey}>
              <FiCopy aria-hidden="true" /> Copiar
            </button>
          </div>
          <span role="status">{copyStatus}</span>
        </div>}
        {ong.supplies?.length > 0 && <>
          <h3>Insumos necessários</h3>
          <ul>{ong.supplies.map((item) => <li key={item}>{item}</li>)}</ul>
        </>}
        {ong.donationInstructions && <p className="ong-profile-description">{ong.donationInstructions}</p>}
        <p className="ong-donation-note">
          <FiInfo aria-hidden="true" />
          <span>A doação é feita diretamente com a ONG.</span>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button className="adoption-control" type="button" onClick={onClose}>Fechar</button>
        {(ong.whatsapp || ong.email) && <button className="adoption-action ong-donation-delivery" type="button" onClick={() => {
          setGoToContact(true);
          onClose();
        }}>
          Combinar entrega
        </button>}
      </Modal.Footer>
    </Modal>
  );
}
