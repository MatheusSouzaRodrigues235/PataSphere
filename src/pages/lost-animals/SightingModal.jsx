import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiSend, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import formatOnBlur from '@/pages/register/formatOnBlur';
import '@/styles/_adoption-request.scss';

const formatPhone = formatOnBlur(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

export default function SightingModal({ name, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (submitted) titleRef.current?.focus();
  }, [submitted]);

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <Modal
      show
      centered
      scrollable
      onHide={onClose}
      className="adoption-request-modal sighting-modal"
      backdropClassName="adoption-request-backdrop"
      aria-labelledby="sighting-title"
      aria-describedby="sighting-description"
    >
      <Modal.Header>
        <div>
          <Modal.Title as="h2" id="sighting-title" ref={titleRef} tabIndex={-1}>
            {submitted ? 'Aviso simulado' : 'Preencha o local onde o animal foi avistado!'}
          </Modal.Title>
          <p id="sighting-description">
            {submitted
              ? 'A simulação foi concluída sem enviar seus dados ao responsável.'
              : 'Informe onde você viu ' + name + '. Este formulário simula o envio do aviso ao responsável.'}
          </p>
        </div>
        <button type="button" className="adoption-control adoption-request-close" aria-label="Fechar modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </Modal.Header>

      <Modal.Body>
        {submitted ? (
          <button type="button" className="adoption-action sighting-submit" onClick={onClose}>Voltar ao anúncio</button>
        ) : (
          <form className="adoption-request-content" onSubmit={submit}>
            <label className="adoption-request-field">
              Seu nome
              <input name="name" className="form-control" autoComplete="name" placeholder="Insira seu nome" maxLength={80} pattern={String.raw`.*\S.*`} title="Informe seu nome." required />
            </label>
            <label className="adoption-request-field">
              Seu contato (WhatsApp)
              <span className="sighting-phone">
                <span className="sighting-phone-icon" aria-hidden="true"><FaWhatsapp /></span>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  autoComplete="tel-national"
                  placeholder="(99) 99999-9999"
                  pattern={String.raw`(?:[0-9]{10,11}|\([0-9]{2}\) [0-9]{4,5}-[0-9]{4})`}
                  title="Informe o DDD e o número, com 10 ou 11 dígitos."
                  maxLength={20}
                  onBlur={formatPhone}
                  required
                />
              </span>
            </label>
            <label className="adoption-request-field">
              Local onde foi avistado
              <input name="place" className="form-control" placeholder="Rua, bairro ou ponto de referência" maxLength={160} pattern={String.raw`.*\S.*`} title="Informe onde o animal foi avistado." required />
            </label>
            <button type="submit" className="adoption-action sighting-submit">
              <FiSend aria-hidden="true" /> Enviar aviso
            </button>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
}
