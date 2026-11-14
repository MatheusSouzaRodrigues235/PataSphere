import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiSend, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { requestLostAnimals } from './lostAnimalsApi';
import formatOnBlur from '@/pages/register/formatOnBlur';
import '@/styles/_adoption-request.scss';

const formatPhone = formatOnBlur(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

export default function SightingModal({ animal, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submission = useRef(null);
  const pending = useRef(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (submitted) titleRef.current?.focus();
  }, [submitted]);

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const signature = JSON.stringify(fields);
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      if (submission.current?.signature !== signature) {
        submission.current = { signature, key: crypto.randomUUID() };
      }
      await requestLostAnimals('/' + animal.id + '/avistamentos', {
        method: 'POST', body: { ...fields, key: submission.current.key },
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal
      show
      centered
      scrollable
      onHide={saving ? undefined : onClose}
      className="adoption-request-modal sighting-modal"
      backdropClassName="adoption-request-backdrop"
      aria-labelledby="sighting-title"
      aria-describedby="sighting-description"
    >
      <Modal.Header>
        <div>
          <Modal.Title as="h2" id="sighting-title" ref={titleRef} tabIndex={-1}>
            {submitted ? 'Avistamento registrado' : 'Preencha o local onde o animal foi avistado!'}
          </Modal.Title>
          <p id="sighting-description">
            {submitted
              ? 'O aviso está disponível na caixa de avistamentos do responsável pelo anúncio.'
              : 'Informe onde você viu ' + animal.name + '. Seu nome e WhatsApp serão compartilhados com o responsável pelo anúncio.'}
          </p>
        </div>
        <button type="button" className="adoption-control adoption-request-close" aria-label="Fechar modal" disabled={saving} onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </Modal.Header>

      <Modal.Body>
        {submitted ? (
          <button type="button" className="adoption-action sighting-submit" onClick={onClose}>Voltar ao anúncio</button>
        ) : (
          <form onSubmit={submit}>
            <fieldset className="adoption-request-content" disabled={saving}>
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
                    pattern={String.raw`(?:[1-9]{2}[0-9]{8,9}|\([1-9]{2}\) [0-9]{4,5}-[0-9]{4})`}
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
              {error && <p className="text-danger" role="alert">{error}</p>}
              <button type="submit" className="adoption-action sighting-submit">
                <FiSend aria-hidden="true" /> {saving ? 'Enviando…' : 'Enviar aviso'}
              </button>
            </fieldset>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
}
