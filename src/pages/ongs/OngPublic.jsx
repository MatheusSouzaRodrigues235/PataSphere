import { useEffect, useState } from 'react';
import { FiCalendar, FiChevronRight, FiCopy, FiFacebook, FiGlobe, FiHeart, FiInstagram, FiMail, FiMapPin, FiPackage } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { AdoptionFooter } from '@/pages/adoption/AdoptionNavigation';
import SiteHeader from '@/components/layout/SiteHeader';
import { adoptionAnimals, adoptionPath } from '@/pages/adoption/adoptionData';
import NotFound from '@/pages/NotFound';
import { ongSettingsPath, readOngSettings } from '@/pages/ong-settings/ongSettingsStorage';
import OngDonationModal from './OngDonationModal';
import { ongAdoptionSearch, ongProfiles } from './ongProfiles';
import '@/styles/_adoption.scss';
import '@/styles/_ong-public.scss';

const sections = [
  ['sobre', 'Sobre'],
  ['animais', 'Animais para adoção'],
  ['como-ajudar', 'Como ajudar'],
  ['contato', 'Contato'],
];

export function OngPublicLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      target?.scrollIntoView();
      if (hash === '#contato') target?.focus({ preventScroll: true });
    }
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo" className="ong-public"><Outlet /></main>
      <AdoptionFooter showLostAnimals={pathname === '/ongs'} />
    </>
  );
}

function OngContact({ ong }) {
  const contacts = [
    ['Endereço', FiMapPin, ong.city && <>{ong.address && <>{ong.address}<br /></>}{ong.city}</>],
    ['WhatsApp', FaWhatsapp, ong.whatsapp],
    ['E-mail', FiMail, ong.email],
    ['Instagram', FiInstagram, ong.instagram],
    ['Facebook', FiFacebook, ong.facebook],
    ['Site', FiGlobe, ong.website],
  ].filter(([, , value]) => value);
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ong.city);

  return (
    <section id="contato" className="ong-public-panel ong-contact" tabIndex={-1}>
      <h2>Contato e localização</h2>
      {ong.city && <a className="ong-map" href={mapUrl} target="_blank" rel="noreferrer">
        <FiMapPin aria-hidden="true" />
        Ver cidade no mapa
      </a>}
      <dl>
        {contacts.map(([label, Icon, value]) => (
          <div key={label}>
            <span className="ong-public-icon"><Icon aria-hidden="true" /></span>
            <div><dt>{label}</dt><dd>{value}</dd></div>
          </div>
        ))}
      </dl>
      {!ong.preview && <p className="ong-contact-note">Endereço e contatos demonstrativos.</p>}
    </section>
  );
}

function OngAnimals({ animals, boardSearch }) {
  return (
    <section id="animais" className="ong-public-panel">
      <div className="ong-section-heading">
        <h2>Animais para adoção</h2>
        <Link to={'/adocao?' + boardSearch}>Ver todos <FiChevronRight aria-hidden="true" /></Link>
      </div>
      {animals.length === 0 && <p>Nenhum animal divulgado para adoção por esta ONG.</p>}
      <div className="ong-animal-grid">
        {animals.map((animal) => (
          <article className="ong-animal-card" key={animal.id}>
            <div className="ong-animal-photo">
              <img src={animal.photo} alt={animal.name} loading="lazy" />
              <span className="adoption-status" data-urgent={animal.urgent}>{animal.urgent ? 'Urgente' : 'Disponível'}</span>
            </div>
            <div className="ong-animal-body">
              <h3>{animal.name}</h3>
              <p>{animal.species} · {animal.ageLabel} · {animal.size}</p>
              <Link to={adoptionPath(animal)} state={{ boardSearch }} className="adoption-action" aria-label={'Quero adotar ' + animal.name}>
                Quero adotar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OngHelp({ supplies, hasPix, onDonate }) {
  const options = [
    ['Adote', FiHeart, 'Conheça os animais e envie sua solicitação.', '#animais'],
    hasPix && ['Doe via Pix', FiCopy, 'Confira os dados para doação.'],
    supplies.length > 0 && ['Doe insumos', FiPackage, 'Confira a lista de itens necessários.'],
  ].filter(Boolean);

  return (
    <section id="como-ajudar" className="ong-public-panel">
      <h2>Como ajudar</h2>
      <div className="ong-help-grid">
        {options.map(([label, Icon, description, href]) => {
          const content = (
            <>
              <span className="ong-public-icon"><Icon aria-hidden="true" /></span>
              <strong>{label}</strong>
              <span className="ong-help-description">{description}</span>
            </>
          );

          return href
            ? <a key={label} className="ong-help-card" href={href}>{content}</a>
            : <button key={label} className="ong-help-card" type="button" aria-haspopup="dialog" onClick={onDonate}>{content}</button>;
        })}
      </div>
      <ul className="ong-supplies" aria-label="Insumos necessários">
        {supplies.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export function OngProfile() {
  const { ongSlug } = useParams();
  const ong = ongProfiles.find(({ slug }) => slug === ongSlug);
  return ong ? <OngProfileView key={ongSlug} ong={ong} /> : <NotFound />;
}

export function OngProfilePreview() {
  const { profile, images, privacy, donations } = readOngSettings();
  const socialLink = (domain, username) => username && domain + '/' + encodeURIComponent(username.replace(/^@/, ''));
  const ong = {
    ...ongProfiles[0],
    preview: true,
    name: profile.name,
    tagline: profile.tagline,
    description: profile.bio,
    founded: profile.founded,
    address: '',
    city: privacy.location ? [profile.city, profile.state].filter(Boolean).join(' – ') : '',
    email: privacy.contact ? profile.email : '',
    whatsapp: privacy.contact ? profile.whatsapp : '',
    website: profile.website,
    instagram: socialLink('instagram.com', profile.instagram),
    facebook: socialLink('facebook.com', profile.facebook),
    pixKey: profile.pixKey,
    supplies: [...new Set(donations.supplies.split('\n').map((item) => item.trim()).filter(Boolean))],
    ...images,
  };
  return <OngProfileView ong={ong} />;
}

function Description({ text }) {
  return <p className="ong-profile-description">{text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, index) => {
    if (index % 2 === 0) return part;
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <em key={index}>{part.slice(1, -1)}</em>;
  })}</p>;
}

function OngProfileView({ ong }) {
  const [donationOpen, setDonationOpen] = useState(false);
  const organization = ong.preview ? ongProfiles[0] : ong;
  const animals = adoptionAnimals.filter((animal) => animal.organization === organization.name);
  const featured = ong.featured
    ? ong.featured.map((name) => animals.find((animal) => animal.name === name)).filter(Boolean)
    : animals.slice(0, 4);
  const boardSearch = ongAdoptionSearch(organization);
  const canDonate = Boolean(ong.pixKey || ong.supplies?.length);
  const stats = [
    ['Animais para adoção', animals.length],
    ['Animais adotados', ong.adopted ?? '—'],
    ['Ano de fundação', ong.founded ?? '—'],
  ];

  return (
    <div className="ong-public-container">
      <nav aria-label="Localização na página">
        <ol className="ong-breadcrumb">
          <li><Link to="/">Home</Link></li>
          <li><FiChevronRight aria-hidden="true" /><Link to="/ongs">ONGs</Link></li>
          <li aria-current="page"><FiChevronRight aria-hidden="true" />{ong.name}</li>
        </ol>
      </nav>

      {ong.preview && <div className="ong-preview-banner">
        <strong>Prévia do perfil público</strong>
        <Link to={ongSettingsPath}>Voltar para edição</Link>
      </div>}
      <section className="ong-hero" aria-labelledby="ong-name">
        <div className="ong-cover" aria-hidden="true">{ong.cover && <img src={ong.cover} alt="" />}</div>
        <div className="ong-identity">
          <span className="ong-avatar" style={{ backgroundColor: ong.color }} aria-hidden="true">
            {ong.logo ? <img src={ong.logo} alt="" /> : ong.name[0]}
          </span>
          <div className="ong-identity-text">
            <h1 id="ong-name">{ong.name}</h1>
            <p>{ong.tagline}</p>
            <ul>
              {ong.city && <li><FiMapPin aria-hidden="true" /> {ong.city}</li>}
              {ong.founded && <li><FiCalendar aria-hidden="true" /> Fundada em {ong.founded}</li>}
            </ul>
          </div>
          {(ong.whatsapp || canDonate) && <div className="ong-hero-actions">
            {ong.whatsapp && <a className="adoption-action ong-whatsapp" href="#contato"><FaWhatsapp aria-hidden="true" /> Ver WhatsApp</a>}
            {canDonate && <button className="adoption-action" type="button" aria-haspopup="dialog" onClick={() => setDonationOpen(true)}>
              <FiHeart aria-hidden="true" /> Como doar
            </button>}
          </div>}
        </div>
        <dl className="ong-stats">
          {stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>

      <nav className="ong-section-nav" aria-label="Seções do perfil">
        {sections.filter(([id]) => id !== 'como-ajudar' || canDonate).map(([id, label]) => (
          <a key={id} className="adoption-control" href={'#' + id}>{label}</a>
        ))}
      </nav>

      <div className="ong-profile-grid">
        <section id="sobre" className="ong-public-panel">
          <h2>Sobre a ONG</h2>
          <Description text={ong.description || 'Descrição ainda não informada.'} />
        </section>
        <OngAnimals animals={featured} boardSearch={boardSearch} />
        {canDonate && <OngHelp supplies={ong.supplies ?? []} hasPix={Boolean(ong.pixKey)} onDonate={() => setDonationOpen(true)} />}
        {ong.address || ong.preview ? <OngContact ong={ong} /> : (
          <section id="contato" className="ong-public-panel ong-contact" tabIndex={-1}>
            <h2>Contato e localização</h2>
            <p>{ong.neighborhood} · {ong.city}</p>
            <p>Contatos ainda não divulgados.</p>
          </section>
        )}
      </div>
      {canDonate && <OngDonationModal ong={ong} show={donationOpen} onClose={() => setDonationOpen(false)} />}
    </div>
  );
}
