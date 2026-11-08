import { Col, Container, Row } from 'react-bootstrap';
import logo from '@/assets/logo-patasphere.svg';
export default function SiteFooter() {
  return <footer className="site-footer"><Container><Row className="g-4">
    <Col md={6}><a href="/" className="footer-brand"><img src={logo} alt="" width="42" height="42" />PataSphere</a><p className="footer-description">Conectando pessoas, apoiando quem cuida e escrevendo novas histórias para a causa animal.</p></Col>
    <Col xs={6} md={3}><h2>Explore o projeto</h2><ul><li><a href="/#beneficios">A plataforma</a></li><li><a href="/#quem-somos">Quem somos</a></li><li><a href="/#missao">Nossa missão</a></li></ul></Col>
    <Col xs={6} md={3}><h2>Vamos juntos</h2><ul><li><a href="/#como-funciona">Como funciona</a></li><li><a href="/#para-ongs">Para ONGs</a></li></ul><span className="footer-location">São José dos Campos · SP</span></Col>
    </Row><div className="footer-bottom"><span>© {new Date().getFullYear()} PataSphere</span><span>Projeto acadêmico · Matheus Souza Rodrigues · UNINTER</span></div></Container></footer>;
}
