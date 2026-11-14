import { useEffect, useState } from 'react';
import { FiCalendar, FiChevronRight, FiCopy, FiFacebook, FiGlobe, FiHeart, FiInstagram, FiMail, FiMapPin, FiPackage } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { AdoptionFooter } from '@/pages/adoption/AdoptionNavigation';
import { useOngSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import { adoptionPath } from '@/pages/adoption/adoptionData';
import AdoptionPhoto from '@/pages/adoption/AdoptionPhoto';
import { useAdoptionAnimals } from '@/pages/adoption/adoptionApi';
import NotFound from '@/pages/NotFound';
import { ongSettingsPath, readOngSettings } from '@/pages/ong-settings/ongSettingsStorage';
import OngDonationModal from './OngDonationModal';
import { ongAdoptionSearch } from './ongProfiles';
import { useOrganizations } from './organizationApi';
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

function whatsappUrl(phone) {
  const digits = phone?.replace(/\D/g, '');
  return /^\d{10,11}$/.test(digits ?? '') ? 'https://wa.me/55' + digits : null;
}

function OngContact({ ong }) {
  const contacts = [
    ['Localização', FiMapPin, [ong.neighborhood, ong.city].filter(Boolean).join(' · ')],
    ['WhatsApp', FaWhatsapp, ong.whatsapp, whatsappUrl(ong.whatsapp)],
    ['E-mail', FiMail, ong.email, ong.email && 'mailto:' + ong.email],
    ['Instagram', FiInstagram, ong.instagram, ong.instagram],
    ['Facebook', FiFacebook, ong.facebook, ong.facebook],
    ['Site', FiGlobe, ong.website, ong.website],
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
        {contacts.map(([label, Icon, value, href]) => (
          <div key={label}>
            <span className="ong-public-icon"><Icon aria-hidden="true" /></span>
            <div><dt>{label}</dt><dd>{href ? <a href={href}>{value}</a> : value}</dd></div>
          </div>
        ))}
      </dl>
      {!contacts.length && <p>Contatos e localização ainda não divulgados.</p>}
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
              <AdoptionPhoto src={animal.photo} alt={animal.name} loading="lazy" />
              <span className="adoption-status" data-urgent={animal.urgent}>{animal.status === 'Disponível' && animal.urgent ? 'Urgente' : animal.status}</span>
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

function OngHelp({ supplies, hasPix, instructions, onDonate }) {
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
      {instructions && <p className="ong-profile-description">{instructions}</p>}
      <ul className="ong-supplies" aria-label="Insumos necessários">
        {supplies.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export function OngProfile({ preview = false }) {
  const { ongSlug } = useParams();
  const account = useOngSession();
  const id = preview ? account?.id ?? null : ongSlug;
  const { data, loading, error, reload } = useOrganizations(id);
  if (preview && !account) return <OngDemoPreview />;
  if (loading) return <p className="ong-public-container" role="status">Carregando ONG…</p>;
  if (error) {
    return (
      <div className="ong-public-container">
        <p role="alert">{error}</p>
        <button type="button" className="adoption-control" onClick={reload}>Tentar novamente</button>
      </div>
    );
  }
  const ong = data?.organization;
  return ong ? <OngProfileView key={id} ong={{ ...ong, preview }} /> : <NotFound />;
}

export function OngProfilePreview() {
  return <OngProfile preview />;
}

function OngDemoPreview() {
  const { profile, images, privacy, donations } = readOngSettings();
  const socialLink = (domain, username) => username && 'https://www.' + domain + '/' + encodeURIComponent(username.replace(/^@/, ''));
  const ong = {
    preview: true,
    name: profile.name,
    tagline: profile.tagline,
    description: profile.bio,
    founded: profile.founded,
    city: privacy.location ? [profile.city, profile.state].filter(Boolean).join(' – ') : '',
    email: privacy.contact ? profile.email : '',
    whatsapp: privacy.contact ? profile.whatsapp : '',
    website: profile.website,
    instagram: socialLink('instagram.com', profile.instagram),
    facebook: socialLink('facebook.com', profile.facebook),
    pixKey: profile.pixKey,
    donationInstructions: donations.instructions,
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
  const { data } = useAdoptionAnimals(ong.accountId ? '' : null);
  const animals = (data?.animals ?? []).filter((animal) => animal.organizationId === ong.accountId);
  const featured = animals.slice(0, 4);
  const boardSearch = ongAdoptionSearch(ong);

  const canDonate = Boolean(ong.pixKey || ong.supplies?.length || ong.donationInstructions);
  const stats = [
    ['Animais para adoção', data ? animals.length : ong.available ?? '—'],
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
          <span className="ong-avatar" style={{ backgroundColor: '#282f3d' }} aria-hidden="true">
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
            {ong.whatsapp && <a className="adoption-action ong-whatsapp" href={whatsappUrl(ong.whatsapp) ?? '#contato'}><FaWhatsapp aria-hidden="true" /> Ver WhatsApp</a>}
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
        {canDonate && <OngHelp supplies={ong.supplies ?? []} hasPix={Boolean(ong.pixKey)} instructions={ong.donationInstructions} onDonate={() => setDonationOpen(true)} />}
        <OngContact ong={ong} />
      </div>
      {canDonate && <OngDonationModal ong={ong} show={donationOpen} onClose={() => setDonationOpen(false)} />}
    </div>
  );
}
