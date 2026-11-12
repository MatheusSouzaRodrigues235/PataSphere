import { useState } from 'react';
import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiBell, FiGrid, FiHeart, FiLogOut, FiUser } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import logo from '@/assets/logo-patasphere.svg';
import { readTutorData, tutorAnimalsPath } from '@/pages/tutor/tutorStorage';
import { ongSettingsPath, readOngSettings } from '@/pages/ong-settings/ongSettingsStorage';
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
    ['/perfil/tutor/notificacoes', 'Notificações', FiBell],
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

function AccountMenu({ role, identity, closeMenu }) {
  const { name, email, photo } = identity ?? readIdentity(role);
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('pt-BR') || '?';

  return (
    <Dropdown align="end" className="site-account" onSelect={closeMenu}>
      <Dropdown.Toggle id="site-account-toggle" className="site-account-toggle" aria-label={`Menu da conta de ${name}`}>
        {photo ? <img src={photo} alt="" /> : initial}
      </Dropdown.Toggle>
      <Dropdown.Menu aria-labelledby="site-account-toggle">
        <div className="site-account-identity">
          <strong>{name}</strong>
          {email && <span>{email}</span>}
        </div>
        {accountLinks[role].map(([path, label, Icon]) => (
          <Dropdown.Item key={path} as={NavLink} to={path} end eventKey={path}>
            <Icon aria-hidden="true" /> {label}
          </Dropdown.Item>
        ))}
        <Dropdown.Item as={Link} to="/" replace eventKey="sair" className="site-account-signout" onClick={clearDemoRole}>
          <FiLogOut aria-hidden="true" /> Sair
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

function Header({ role, identity }) {
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
          {role ? <AccountMenu role={role} identity={identity} closeMenu={closeMenu} /> : (
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
  return <Header key={pathname} role={role ?? readDemoRole()} identity={identity} />;
}
