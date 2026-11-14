import { useState } from 'react';
import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiGrid, FiHeart, FiLogOut, FiUser } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import logo from '@/assets/logo-patasphere.svg';
import { readTutorData, tutorAnimalsPath } from '@/pages/tutor/tutorStorage';
import { ongSettingsPath, readOngSettings } from '@/pages/ong-settings/ongSettingsStorage';
import { endAccountSession, useAccountSession } from '@/app/accountSession';
import { sightingsInboxPath } from '@/pages/lost-animals/lostAnimalsApi';
import { notificationsPath, useNotifications } from '@/pages/notifications/notificationApi';
import { clearDemoRole, readDemoRole } from '@/app/demoSession';

const publicLinks = [
  ['/', 'Home'],
  ['/animais-perdidos', 'Animais perdidos'],
  ['/adocao', 'Adotar um animal'],
  ['/ongs', 'Visualizar ONGs'],
];

const accountLinks = {
  tutor: [
    ['/perfil/tutor', 'Meu perfil', FiUser],
    [tutorAnimalsPath, 'Meus animais', LuPawPrint],
    ['/perfil/tutor/notificacoes', 'Preferências de notificação', FiBell],
  ],
  ong: [
    ['/dashboard/ong', 'Painel da ONG', FiGrid],
    ['/dashboard/ong/animais', 'Animais', LuPawPrint],
    ['/dashboard/ong/doacoes', 'Doações', FiHeart],
    [ongSettingsPath, 'Perfil da ONG', FiUser],
  ],
};

function readIdentity(role) {
  if (role === 'ong') {
    const { profile, images } = readOngSettings();
    return { name: profile.name || 'Amor de Pet', email: profile.email, photo: images.logo };
  }

  try {
    const { profile, photo } = readTutorData();
    const name = [profile?.firstName, profile?.lastName?.split(/\s+/)[0]].filter(Boolean).join(' ');
    return { name: name || 'Matheus Souza', email: profile?.email, photo };
  } catch {
    return { name: 'Matheus Souza' };
  }
}

function AccountMenu({ role, identity, closeMenu, authenticated }) {
  const navigate = useNavigate();
  const account = useAccountSession();
  const { data } = useNotifications(account?.id, '/nao-lidas');
  const unread = data?.unread ?? 0;
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setError('');
    setSigningOut(true);
    try {
      if (authenticated && !(await endAccountSession()).ok) throw new Error('Falha ao sair');
      clearDemoRole();
      await navigate('/', { replace: true });
    } catch {
      setError('Não foi possível sair. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  }

  const { name, email, photo } = identity ?? readIdentity(role);
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('pt-BR') || '?';

  return (
    <Dropdown align="end" className="site-account" onSelect={closeMenu} autoClose="outside">
      <Dropdown.Toggle id="site-account-toggle" className="site-account-toggle" aria-label={`Menu da conta de ${name}${unread ? ', notificações não lidas: ' + unread : ''}`}>
        {photo ? <img src={photo} alt="" /> : initial}
      </Dropdown.Toggle>
      {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger pe-none" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      <Dropdown.Menu aria-labelledby="site-account-toggle">
        <div className="site-account-identity">
          <strong>{name}</strong>
          {email && <span>{email}</span>}
        </div>
        {accountLinks[role].map(([path, label, Icon]) => (
          <Dropdown.Item key={path} as={NavLink} to={path} end eventKey={path} onClick={() => closeMenu()}>
            <Icon aria-hidden="true" /> {label}
          </Dropdown.Item>
        ))}
        {authenticated && <Dropdown.Item as={NavLink} to={notificationsPath} eventKey={notificationsPath}>
          <FiBell aria-hidden="true" /> Notificações{unread > 0 && ' (' + unread + ')'}
        </Dropdown.Item>}
        {authenticated && <Dropdown.Item as={NavLink} to={sightingsInboxPath} eventKey={sightingsInboxPath}>
          <FiBell aria-hidden="true" /> Avistamentos recebidos
        </Dropdown.Item>}
        <Dropdown.Item as="button" type="button" disabled={signingOut} className="site-account-signout" onClick={signOut}>
          <FiLogOut aria-hidden="true" /> {signingOut ? 'Saindo…' : 'Sair'}
        </Dropdown.Item>
        {error && <div className="site-account-identity" role="alert">{error}</div>}
      </Dropdown.Menu>
    </Dropdown>
  );
}

function Header({ role, identity, authenticated }) {
  const [expanded, setExpanded] = useState(false);
  const closeMenu = () => setExpanded(false);

  return (
    <Navbar as="header" expand="lg" sticky="top" className="site-header" expanded={expanded} onToggle={setExpanded}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" onClick={closeMenu} aria-label="PataSphere, página inicial">
          <img src={logo} alt="" width={44} height={44} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-principal" aria-label={expanded ? 'Fechar menu' : 'Abrir menu'} />
        <Navbar.Collapse id="menu-principal">
          <Nav as="nav" aria-label="Menu principal" className="ms-lg-auto align-items-lg-center">
            {publicLinks.map(([path, label]) => (
              <Nav.Link key={path} as={NavLink} to={path} end={path === '/'} onClick={closeMenu}>{label}</Nav.Link>
            ))}
          </Nav>
          {role ? <AccountMenu role={role} identity={identity} closeMenu={closeMenu} authenticated={authenticated} /> : (
            <div className="site-guest-actions">
              <Link className="site-login" to="/login" onClick={closeMenu}>Entrar</Link>
              <Link className="site-register" to="/cadastro" onClick={closeMenu}>Cadastrar</Link>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default function SiteHeader({ role, identity }) {
  const { pathname } = useLocation();
  const account = useAccountSession();
  const currentRole = account?.role ?? role ?? readDemoRole();
  const currentIdentity = currentRole === role ? identity ?? account : account;
  return <Header key={pathname} role={currentRole} identity={currentIdentity} authenticated={Boolean(account)} />;
}
