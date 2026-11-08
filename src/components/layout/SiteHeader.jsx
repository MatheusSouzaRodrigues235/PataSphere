import { useState } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import logo from '@/assets/logo-patasphere.svg';

export default function SiteHeader() {
  const [expanded, setExpanded] = useState(false);
  const closeMenu = () => setExpanded(false);
  return (
    <Navbar expand="lg" sticky="top" className="site-header" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={closeMenu} aria-label="PataSphere, página inicial">
          <img src={logo} alt="" width={40} height={40} /><span>Pata<span className="brand-accent">Sphere</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-principal" aria-label={expanded ? 'Fechar menu' : 'Abrir menu'} />
        <Navbar.Collapse id="menu-principal">
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link href="/#beneficios" onClick={closeMenu}>A plataforma</Nav.Link>
            <Nav.Link href="/#quem-somos" onClick={closeMenu}>Quem somos</Nav.Link>
            <Nav.Link href="/#como-funciona" onClick={closeMenu}>Como funciona</Nav.Link>
          </Nav>
          <Button href="/#para-ongs" onClick={closeMenu} className="ms-lg-4 mt-2 mt-lg-0">Para ONGs <FiArrowUpRight aria-hidden="true" /></Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
