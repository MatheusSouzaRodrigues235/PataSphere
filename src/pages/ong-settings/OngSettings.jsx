import { useRef, useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { FiBell, FiCamera, FiEye, FiHeart, FiLock, FiShield, FiUser, FiX } from 'react-icons/fi';
import logo from '@/assets/logo-patasphere.svg';
import { TutorConfirm, TutorPreferences, TutorSecurity } from '@/pages/tutor/TutorSections';
import OngProfileForm from './OngProfileForm';
import { OngImages, OngReceiving } from './OngSettingsSections';
import { initialSettings, ongPreviewPath, ongSettingsPath, readOngSettings, writeOngSettings } from './ongSettingsStorage';
import '@/styles/_tutor-profile.scss';
import '@/styles/_ong-settings.scss';

const sections = {
  perfil: ['Perfil da ONG', 'Perfil público da ONG', 'Adicione informações para que as pessoas conheçam o seu trabalho', FiUser],
  fotos: ['Logo e fotos', 'Logo e fotos', 'Escolha as imagens que identificam a ONG na prévia pública.', FiCamera],
  seguranca: ['Segurança da conta', 'Segurança da conta', 'Gerencie a senha da conta da ONG.', FiLock],
  recebimento: ['Formas de recebimento', 'Formas de recebimento', 'Informe como a ONG recebe doações.', FiHeart],
  notificacoes: ['Preferências de notificação', 'Preferências de notificação', 'Escolha quais avisos a ONG deseja receber.', FiBell],
  privacidade: ['Privacidade', 'Privacidade', 'Escolha quais informações aparecem na prévia pública.', FiShield],
};

const notificationOptions = [
  ['adoption', 'Adoção', 'Novas solicitações e atualizações sobre adoções.'],
  ['sightings', 'Animais perdidos', 'Atualizações e avistamentos.'],
  ['donations', 'Doações', 'Novidades sobre o recebimento de doações.'],
  ['news', 'Novidades', 'Comunicados do PataSphere.'],
];

const privacyOptions = [
  ['contact', 'Contato', 'Mostrar e-mail e WhatsApp.'],
  ['location', 'Localização', 'Mostrar cidade e estado.'],
];

function Avatar({ images, name, small = false }) {
  return (
    <span className={'tutor-avatar' + (small ? ' tutor-avatar-small' : '')} aria-hidden="true">
      {images.logo ? <img src={images.logo} alt="" /> : name[0]?.toLocaleUpperCase('pt-BR')}
    </span>
  );
}

export default function OngSettings() {
  const { secao = 'perfil' } = useParams();
  const [data, setData] = useState(readOngSettings);
  const current = useRef(data);
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!Object.hasOwn(sections, secao)) return <Navigate replace to={ongSettingsPath} />;

  const [, title, description] = sections[secao];

  function save(changes, message = 'Perfil salvo neste navegador.') {
    const next = { ...current.current, ...(typeof changes === 'function' ? changes(current.current) : changes) };
    try {
      writeOngSettings(next);
      current.current = next;
      setData(next);
      setFeedback({ section: secao, message });
      return true;
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível salvar os dados neste navegador.', error: true });
      return false;
    }
  }

  function reset() {
    try {
      writeOngSettings();
      current.current = initialSettings;
      setData(initialSettings);
      setRevision((value) => value + 1);
      setFeedback({ section: secao, message: 'Os dados locais da ONG foram apagados.' });
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível apagar os dados neste navegador.', error: true });
    }
    setConfirm(false);
  }

  const content = {
    perfil: <OngProfileForm profile={data.profile} save={save} />,
    fotos: <OngImages images={data.images} save={save} />,
    seguranca: <TutorSecurity />,
    recebimento: <OngReceiving data={data} save={save} />,
    notificacoes: <TutorPreferences options={notificationOptions} values={data.notifications}
      onSave={(notifications) => save({ notifications }, 'Preferências salvas neste navegador.')} />,
    privacidade: <TutorPreferences options={privacyOptions} values={data.privacy}
      onSave={(privacy) => save({ privacy }, 'Preferências salvas neste navegador.')} />,
  };

  return (
    <div className="tutor-page ong-settings">
      <a className="skip-link" href="#ong-settings-content">Pular para o conteúdo</a>
      <Navbar expand="lg" className="tutor-header">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" aria-label="PataSphere, página inicial">
            <img src={logo} alt="" width="48" height="48" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="ong-settings-menu" label="Alternar menu principal" />
          <Navbar.Collapse id="ong-settings-menu">
            <Nav>
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/animais-perdidos">Animais perdidos</Nav.Link>
              <Nav.Link as={Link} to="/adocao">Adotar um animal</Nav.Link>
              <Nav.Link as={Link} to="/ongs">Visualizar ONGs</Nav.Link>
            </Nav>
            <Link to="/dashboard/ong" className="tutor-header-account" aria-label="Ir para o painel da ONG">
              <Avatar images={data.images} name={data.profile.name} small />
            </Link>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="tutor-layout" id="ong-settings-content">
        <aside className="tutor-card tutor-sidebar">
          <div className="tutor-identity">
            <Avatar images={data.images} name={data.profile.name} />
            <strong>{data.profile.name}</strong>
            <span className="tutor-role">ONG</span>
          </div>
          <nav className="tutor-nav" aria-label="Configurações da ONG">
            <Link to={ongPreviewPath}><FiEye aria-hidden="true" />Visualizar perfil público</Link>
            {Object.entries(sections).map(([id, [label, , , Icon]]) => (
              <NavLink key={id} to={id === 'perfil' ? ongSettingsPath : ongSettingsPath + '/' + id} end
                onClick={() => setFeedback(null)}>
                <Icon aria-hidden="true" />{label}
              </NavLink>
            ))}
            <button type="button" className="tutor-danger" onClick={() => setConfirm(true)}>
              <FiX aria-hidden="true" />Encerrar conta
            </button>
          </nav>
        </aside>
        <section className="tutor-card tutor-panel" aria-labelledby="ong-settings-title">
          <header className="tutor-panel-header">
            <h1 id="ong-settings-title">{title}</h1>
            <p>{description}</p>
          </header>
          <div key={secao + revision}>{content[secao]}</div>
          {feedback?.section === secao && (
            <p className={'tutor-feedback' + (feedback.error ? ' tutor-error' : '')}
              role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>
          )}
        </section>
      </main>
      {confirm && (
        <TutorConfirm title="Encerrar conta" confirm="Apagar dados locais" close={() => setConfirm(false)} action={reset}>
          Apagar as informações, imagens e preferências da ONG salvas neste navegador?
        </TutorConfirm>
      )}
    </div>
  );
}
