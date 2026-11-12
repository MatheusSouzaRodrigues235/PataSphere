import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFacebook, FiHeart, FiLink, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';
import AdoptionDetailModal from './AdoptionDetailModal';
import AdoptionRequestModal from './AdoptionRequestModal';
import { adoptionAnimals, adoptionDetails, adoptionPath } from './adoptionData';
import '@/styles/_adoption-detail.scss';

const adoptionSteps = [
  ['Envie sua solicitação', 'Preencha o formulário sobre o seu lar.'],
  ['Converse com a ONG', 'A conversa continua direto pelo WhatsApp.'],
  ['Conheça e adote', 'A ONG combina o encontro e a entrega responsável.'],
];

function AnimalGallery({ animal }) {
  const [index, setIndex] = useState(0);
  const { photos } = animal;

  return (
    <section className="adoption-detail-panel adoption-gallery" aria-label={'Fotos de ' + animal.name}>
      <div className="adoption-gallery-main">
        <img src={photos[index]} alt={animal.name + ' — foto ' + (index + 1)} />
        {photos.length > 1 && (
          <>
            <button type="button" className="adoption-control" aria-label="Foto anterior" onClick={() => setIndex((index + photos.length - 1) % photos.length)}><FiChevronLeft aria-hidden="true" /></button>
            <button type="button" className="adoption-control" aria-label="Próxima foto" onClick={() => setIndex((index + 1) % photos.length)}><FiChevronRight aria-hidden="true" /></button>
          </>
        )}
      </div>
      <div className="adoption-gallery-thumbnails">
        {photos.map((photo, position) => (
          <button key={photo} type="button" aria-pressed={index === position} aria-label={'Ver foto ' + (position + 1)} onClick={() => setIndex(position)}>
            <img src={photo} alt="" />
          </button>
        ))}
      </div>
    </section>
  );
}

function AnimalProfile({ animal, boardSearch }) {
  const { favorites, toggleFavorite } = useOutletContext();
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const detail = adoptionDetails[animal.name] ?? {};
  const animalCode = detail.code ?? String(100245 + animal.id);
  const shareUrl = new URL(adoptionPath(animal), window.location.origin).href;
  const boardUrl = { pathname: '/adocao', search: boardSearch ? '?' + boardSearch : '' };
  const related = ['Marshmallow', 'Gilson', 'Mimi', 'Thor']
    .map((name) => adoptionAnimals.find((candidate) => candidate.name === name))
    .filter((candidate) => candidate && candidate.id !== animal.id)
    .slice(0, 3);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setModal('share');
    }
  }

  return (
    <div className="adoption-detail">
      <nav aria-label="Localização na página">
        <ol className="adoption-breadcrumb">
          <li><Link to="/">Home</Link></li>
          <li><FiChevronRight aria-hidden="true" /><Link to={boardUrl}>Adotar um animal</Link></li>
          <li aria-current="page"><FiChevronRight aria-hidden="true" />{animal.name}</li>
        </ol>
      </nav>

      <div className="adoption-profile-grid">
        <section className="adoption-detail-panel adoption-profile-summary" aria-labelledby="adoption-profile-title">
          <span className="adoption-status" data-urgent={animal.urgent}>{animal.urgent ? 'Urgente' : 'Disponível'}</span>
          <h1 id="adoption-profile-title">{animal.name} procura um lar</h1>
          <p>{detail.introduction ?? animal.description}</p>
          <ul className="adoption-tags" aria-label="Características">
            {[animal.sex, animal.size, animal.ageLabel].map((label) => <li key={label}>{label}</li>)}
          </ul>
          {detail.traits && (
            <ul className="adoption-tags adoption-traits" aria-label="Temperamento">
              {detail.traits.map((trait) => <li key={trait}>{trait}</li>)}
            </ul>
          )}
          <dl className="adoption-profile-facts">
            {[
              ['Espécie', animal.species],
              ['Raça', animal.breed],
              ['Cor', animal.color],
              ['ID do animal', animalCode],
            ].map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value ?? 'Não informado'}</dd></div>
            ))}
          </dl>
          <div className="adoption-profile-actions">
            <button type="button" className="adoption-action" onClick={() => setModal('request')}>Quero adotar</button>
            <button type="button" className="adoption-favorite" aria-pressed={favorites.includes(animal.id)} aria-label={'Favoritar ' + animal.name} onClick={() => toggleFavorite(animal.id)}>
              <FiHeart aria-hidden="true" />
            </button>
          </div>
          <div className="adoption-share" role="group" aria-label="Compartilhar perfil">
            <strong>Compartilhar</strong>
            <a className="adoption-control" href={'https://wa.me/?text=' + encodeURIComponent(shareUrl)} target="_blank" rel="noreferrer" aria-label="Compartilhar no WhatsApp"><FaWhatsapp aria-hidden="true" /></a>
            <a className="adoption-control" href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)} target="_blank" rel="noreferrer" aria-label="Compartilhar no Facebook"><FiFacebook aria-hidden="true" /></a>
            <button type="button" className="adoption-control" aria-label="Copiar link do animal" onClick={copyLink}><FiLink aria-hidden="true" /></button>
            <span className="adoption-share-status" role="status">{copied ? 'Link copiado' : ''}</span>
          </div>
        </section>
        <AnimalGallery animal={animal} />
      </div>

      <div className="adoption-information-grid">
        <section className="adoption-detail-panel">
          <h2>Sobre {animal.name}</h2>
          <p>{detail.about ?? animal.description}</p>
        </section>
        <section className="adoption-detail-panel">
          <h2>Saúde e cuidados</h2>
          <p>{detail.care ?? 'Informações sobre saúde e cuidados ainda não cadastradas.'}</p>
        </section>
      </div>

      <section className="adoption-detail-panel">
        <h2>Como funciona a adoção</h2>
        <ol className="adoption-steps">
          {adoptionSteps.map(([title, description], index) => (
            <li key={title}>
              <span aria-hidden="true">{index + 1}</span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="adoption-detail-panel">
        <h2>ONG responsável</h2>
        <div className="adoption-organization">
          <span aria-hidden="true">{animal.organization[0]}</span>
          <div><strong>{animal.organization}</strong><p><FiMapPin aria-hidden="true" /> São José dos Campos – SP</p></div>
        </div>
        <div className="adoption-organization-links">
          <button type="button" className="adoption-control" onClick={() => setModal('organization')}>Ver perfil da ONG</button>
          <Link className="adoption-control" to={{ pathname: '/adocao', search: '?' + new URLSearchParams({ ong: animal.organization }) }}>
            Ver todos os animais desta ONG
          </Link>
        </div>
      </section>

      <section className="adoption-detail-panel">
        <h2>Outros animais para adoção</h2>
        <div className="adoption-related">
          {related.map((candidate) => (
            <Link key={candidate.id} to={adoptionPath(candidate)} state={{ boardSearch }}>
              <img src={candidate.photo} alt="" loading="lazy" />
              <div><strong>{candidate.name}</strong><p>{candidate.species} · {candidate.ageLabel} · {candidate.size}</p></div>
            </Link>
          ))}
        </div>
      </section>
      {modal === 'request' && <AdoptionRequestModal animal={animal} animalCode={animalCode} onClose={() => setModal(null)} />}
      {(modal === 'organization' || modal === 'share') && <AdoptionDetailModal kind={modal} animal={animal} shareUrl={shareUrl} onClose={() => setModal(null)} />}
    </div>
  );
}

export default function AdoptionAnimalPage() {
  const { animalId } = useParams();
  const { state } = useLocation();
  const animal = adoptionAnimals.find(({ id }) => String(id) === animalId);

  if (!animal) {
    return (
      <section className="adoption-detail">
        <div className="adoption-detail-panel">
          <h1>Animal não encontrado</h1>
          <Link className="adoption-control" to="/adocao">Voltar ao mural</Link>
        </div>
      </section>
    );
  }

  return <AnimalProfile key={animal.id} animal={animal} boardSearch={state?.boardSearch} />;
}
