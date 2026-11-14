import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useAdoptionAnimals } from './adoptionApi';
import { FiMessageCircle, FiShield, FiX } from 'react-icons/fi';
import '@/styles/_adoption-request.scss';

const fields = [
  { name: 'residence', label: 'Tipo de residência', options: ['Casa com quintal', 'Casa sem quintal', 'Apartamento', 'Outro'] },
  { name: 'pets', label: 'Você tem outros pets?', options: ['Não tenho', 'Tenho cão', 'Tenho gato', 'Tenho mais de um pet', 'Tenho outro tipo de pet'] },
  { name: 'space', label: 'Espaço disponível para o animal', options: ['Pequeno', 'Médio', 'Grande'] },
];

export default function AdoptionRequestModal({ animal, animalCode, onClose }) {
  const [draft, setDraft] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const animalName = (animal.sex === 'Fêmea' ? 'a ' : 'o ') + animal.name;
  const title = reviewing ? 'Tudo pronto para falar com a ONG' : 'Quero adotar ' + animalName;

  const { data, loading, error, reload } = useAdoptionAnimals(reviewing ? '/' + animal.id + '/contato' : null);
  const message = draft ? [
    'Olá! Tenho interesse em adotar ' + animalName + ' (ID ' + animalCode + ').',
    ...fields.map(({ name, label }) => label.replace(/\?$/, '') + ': ' + draft[name]),
    'Li e aceito o termo de adoção responsável.',
  ] : [];
  const whatsappUrl = data?.whatsapp
    ? 'https://wa.me/' + data.whatsapp + '?text=' + encodeURIComponent(message.join('\n'))
    : null;

  useEffect(() => {
    if (!draft) return;
    bodyRef.current?.scrollTo(0, 0);
    titleRef.current?.focus();
  }, [draft, reviewing]);

  function reviewRequest(event) {
    event.preventDefault();
    setDraft(Object.fromEntries(new FormData(event.currentTarget)));
    setReviewing(true);
  }

  return (
    <Modal
      show
      scrollable
      onHide={onClose}
      className="adoption-request-modal"
      backdropClassName="adoption-request-backdrop"
      aria-labelledby="adoption-request-title"
      aria-describedby="adoption-request-description"
    >
      <Modal.Header>
        <div>
          <Modal.Title as="h2" id="adoption-request-title" ref={titleRef} tabIndex={-1}>{title}</Modal.Title>
          <p id="adoption-request-description">
            {reviewing
              ? 'Confira a mensagem para a ' + animal.organization + '. Você pode voltar para editar as respostas.'
              : 'Conte um pouco sobre o seu lar. Essas informações ajudam a ONG a planejar o encontro.'}
          </p>
        </div>
        <button type="button" className="adoption-control adoption-request-close" aria-label="Fechar" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </Modal.Header>
      <Modal.Body ref={bodyRef}>
        {reviewing ? (
          <div className="adoption-request-content">
            <div className="adoption-request-preview">
              {message.map((line) => <p key={line}>{line}</p>)}
            </div>
            {loading && <p role="status" className="adoption-request-note">Consultando o WhatsApp da ONG…</p>}
            {error && (
              <>
                <p role="alert" className="adoption-request-note">{error}</p>
                <button type="button" className="adoption-control adoption-request-back" onClick={reload}>Tentar novamente</button>
              </>
            )}
            {!loading && !error && !whatsappUrl && (
              <p role="status" className="adoption-request-note">A ONG está sem WhatsApp disponível para este anúncio.</p>
            )}
            {whatsappUrl && (
              <>
                <a className="adoption-request-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                  <FiMessageCircle aria-hidden="true" /> Abrir WhatsApp
                </a>
                <p className="adoption-request-note">Confirme o envio da mensagem no WhatsApp.</p>
              </>
            )}
            <button type="button" className="adoption-control adoption-request-back" onClick={() => setReviewing(false)}>
              Voltar e editar
            </button>
          </div>
        ) : (
          <form className="adoption-request-content" onSubmit={reviewRequest}>
            {fields.map(({ name, label, options }) => (
              <label className="adoption-request-field" key={name}>
                {label}
                <select className="form-select" name={name} defaultValue={draft?.[name] ?? ''} required>
                  <option value="" disabled>Selecione uma opção</option>
                  {options.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label className="adoption-request-terms">
              <input className="form-check-input" name="responsibility" type="checkbox" defaultChecked={Boolean(draft?.responsibility)} required />
              <span>Li e aceito o termo de adoção responsável. Comprometo-me a cuidar do animal, mantê-lo saudável e não abandoná-lo.</span>
            </label>
            <button type="submit" className="adoption-request-primary">
              <FiMessageCircle aria-hidden="true" /> Revisar mensagem
            </button>
            <p className="adoption-request-note">
              <FiShield aria-hidden="true" /> Você poderá conferir a mensagem antes de enviá-la à ONG.
            </p>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
}
