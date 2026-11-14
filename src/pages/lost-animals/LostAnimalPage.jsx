import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiChevronRight, FiEye, FiFacebook, FiLink } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import AnimalGallery from '@/pages/adoption/AnimalGallery';
import '@/styles/_adoption-detail.scss';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { tutorAnimalsPath } from '@/pages/tutor/tutorStorage';
import PublishedLocationMap from './PublishedLocationMap';
import SightingModal from './SightingModal';
import { isPublishedAlert, useLostAnimals } from './lostAnimalsApi';
import { exampleAlerts, formatAlertDate, lostAnimalsPath } from './lostAnimalsData';

function LostAnimalProfile({ animal, boardUrl, published, returnToTutor }) {
  const found = animal.kind === 'found';
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryLink = (filters) => ({ pathname: lostAnimalsPath, search: new URLSearchParams(found ? { ...filters, tipo: 'encontrados' } : filters).toString() });
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
    <div className="lost-detail-background">
      <article className="adoption-detail lost-detail" aria-labelledby="lost-detail-title">
        <nav aria-label="Localização na página">
          <ol className="adoption-breadcrumb">
            <li><Link to="/">Home</Link></li>
            <li><FiChevronRight aria-hidden="true" /><Link to={boardUrl}>{found ? 'Animais encontrados' : 'Animais perdidos'}</Link></li>
            <li aria-current="page"><FiChevronRight aria-hidden="true" />{animal.name}</li>
          </ol>
        </nav>

        {returnToTutor && <Link className="adoption-control mb-3" to={tutorAnimalsPath}>Voltar para Meus animais</Link>}
        {published && <p className="alert alert-success" role="status">Anúncio publicado no mural.</p>}

        <div className="adoption-profile-grid">
          <section className="adoption-detail-panel adoption-profile-summary">
            <span className="lost-status" data-found={found}>{animal.closed ? 'Caso encerrado' : found ? 'Encontrado' : 'Perdido'}</span>
            <h1 id="lost-detail-title">{animal.name} {found ? 'foi encontrado em' : 'desapareceu em'} {animal.neighborhood}</h1>
            <ul className="adoption-tags" aria-label="Características">
              <li>{animal.sex}</li>
              <li>Porte {animal.size.toLowerCase()}</li>
              {animal.ageLabel && <li>{animal.ageLabel}</li>}
            </ul>
            <dl className="adoption-profile-facts">
              <div><dt>Espécie</dt><dd>{animal.species}</dd></div>
              <div><dt>Localização</dt><dd>{[animal.city, animal.region].filter(Boolean).join(' - ')}</dd></div>
              {animal.breed && <div><dt>Raça</dt><dd>{animal.breed}</dd></div>}
              <div><dt>{found ? 'Data do encontro' : 'Data do desaparecimento'}</dt><dd><time dateTime={animal.date}>{formatAlertDate(animal.date)}</time></dd></div>
            </dl>
            {!found && !animal.closed && isPublishedAlert(animal.id) && <div className="adoption-profile-actions">
              <button type="button" className="adoption-action" onClick={() => setModal('sighting')}>
                <FiEye aria-hidden="true" /> Você viu este animal?
              </button>
            </div>}
            {animal.example && !animal.closed && (
              <div className="adoption-share" role="group" aria-label="Compartilhar alerta">
                <strong>Compartilhar</strong>
                <a className="adoption-action lost-whatsapp" href={'https://wa.me/?text=' + encodeURIComponent(shareUrl)} target="_blank" rel="noreferrer" aria-label="Compartilhar no WhatsApp"><FaWhatsapp aria-hidden="true" /></a>
                <a className="adoption-control" href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)} target="_blank" rel="noreferrer" aria-label="Compartilhar no Facebook"><FiFacebook aria-hidden="true" /></a>
                <button type="button" className="adoption-control" onClick={copyLink} aria-label="Copiar link"><FiLink aria-hidden="true" /></button>
                <span className="adoption-share-status" role="status">{copied ? 'Link copiado' : ''}</span>
              </div>
            )}
          </section>
          <AnimalGallery name={animal.name} photos={animal.photos ?? [animal.photo]} showSingleThumbnail={false} />
        </div>

        <section className="adoption-detail-panel">
          <h2>Sobre o animal</h2>
          <p>{animal.description}</p>
          {(animal.health || animal.temperament || animal.urgency) && (
            <dl className="adoption-profile-facts mb-0">
              {animal.health && <div><dt>Saúde</dt><dd>{animal.health}</dd></div>}
              {animal.temperament && <div><dt>Temperamento</dt><dd>{animal.temperament}</dd></div>}
              {animal.urgency && <div><dt>Urgência</dt><dd>{animal.urgency}</dd></div>}
            </dl>
          )}
        </section>

        {(!animal.example && (animal.city || animal.point || animal.reference)) && (
          <section className="adoption-detail-panel">
            <h2>Local da ocorrência</h2>
            <p>{[animal.street, animal.neighborhood, animal.city, animal.region, animal.cep].filter(Boolean).join(', ')}</p>
            {animal.reference && <p>{animal.reference}</p>}
            <PublishedLocationMap point={animal.point} cep={animal.cep} address={[animal.street, animal.neighborhood, animal.city, animal.region].filter(Boolean).join(', ') || animal.cep || ''} />
          </section>
        )}

        {!animal.closed && <section className="adoption-detail-panel">
          <h2>Contato do responsável pelo anúncio</h2>
          {animal.example ? (
            <p>Alerta de exemplo.</p>
          ) : (
            <>
              <dl className="adoption-profile-facts lost-contact-facts">
                <div><dt>Nome</dt><dd>{animal.contactName}</dd></div>
                {animal.email && <div><dt>E-mail</dt><dd><a href={'mailto:' + animal.email}>{animal.email}</a></dd></div>}
                <div><dt>Telefone</dt><dd><a href={'tel:' + animal.phone.replace(/[^+0-9]/g, '')}>{animal.phone}</a></dd></div>
              </dl>
              <p>{found ? 'Reconheceu o animal? Entre em contato com o responsável pelo anúncio.' : 'Se você tem alguma informação, entre em contato ou use o botão “Você viu este animal?”.'}</p>
            </>
          )}
          <nav className="lost-contact-links" aria-label="Mais anúncios">
            <Link className="adoption-action" to={queryLink({ city: animal.city, neighborhood: animal.neighborhood })}>Ver animais no mesmo bairro</Link>
            <Link className="adoption-action" to={queryLink({ city: animal.city })}>Ver animais em {animal.city}</Link>
          </nav>
        </section>}
      </article>
      {modal === 'sighting' && <SightingModal animal={animal} onClose={() => setModal(null)} />}
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
  const { tutorAlerts } = useOutletContext();
  const { animalId } = useParams();
  const { state } = useLocation();
  const { data, loading, error, reload } = useLostAnimals(isPublishedAlert(animalId) ? '/' + animalId : null);
  const animal = data?.alert ?? [...tutorAlerts, ...exampleAlerts].find(({ id }) => id === animalId);
  const boardUrl = { pathname: lostAnimalsPath, search: state?.boardSearch ?? (animal?.kind === 'found' ? 'tipo=encontrados' : '') };

  if (animal) return <LostAnimalProfile key={animal.id} animal={animal} boardUrl={boardUrl} published={state?.published} returnToTutor={state?.returnToTutor} />;

  return (
    <div className="adoption-board">
      <div className="adoption-container adoption-empty">
        <h1>{loading ? 'Carregando anúncio…' : error || 'Alerta indisponível'}</h1>
        {error && <button type="button" className="adoption-control" onClick={reload}>Tentar novamente</button>}
        <Link to={lostAnimalsPath} className="adoption-control">Voltar à vitrine</Link>
      </div>
    </div>
  );
}
