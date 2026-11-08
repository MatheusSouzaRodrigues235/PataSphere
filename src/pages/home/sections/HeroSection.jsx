import { Button, Col, Container, Row } from 'react-bootstrap';
import { FiArrowRight, FiHeart, FiMapPin, FiCheck } from 'react-icons/fi';
import logo from '@/assets/logo-patasphere.svg';

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <Container>
        <Row className="align-items-center gx-4 gy-5">
          <Col lg={7}>
            <span className="badge-soft"><span className="status-dot" /> Conectando pessoas e patas</span>
            <h1 id="hero-titulo">Todo animal merece<br />uma nova <span>história.</span></h1>
            <p className="hero-description">Mais lares, mais reencontros, mais cuidado. Um espaço para aproximar quem quer ajudar de quem precisa de uma segunda chance.</p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Button href="#beneficios" size="lg">Conhecer o PataSphere <FiArrowRight aria-hidden="true" /></Button>
              <Button href="#para-ongs" size="lg" variant="outline-dark">Sou uma ONG</Button>
            </div>
            <p className="hero-location"><FiMapPin aria-hidden="true" /> Começando por São José dos Campos, SP</p>
          </Col>
          <Col lg={5}>
            <div className="hero-art">
              <div className="art-orbit" />
              <span className="art-label">PEQUENAS PATAS. GRANDES CONEXÕES.</span>
              <img src={logo} alt="Ilustração da marca PataSphere" width="699" height="692" fetchPriority="high" />
              <div className="art-note art-note-top"><span><FiHeart aria-hidden="true" /></span><div>Um novo começo<small>O amor encontra um lar.</small></div></div>
              <div className="art-note art-note-bottom"><span><FiCheck aria-hidden="true" /></span><div>Juntos pela causa animal</div></div>
              <span className="art-spark" aria-hidden="true">✳</span>
            </div>
          </Col>
        </Row>
      </Container>
      <div className="hero-strip"><Container><span>Adoção responsável</span><span aria-hidden="true">✳</span><span>Conexões locais</span><span aria-hidden="true">✳</span><span>Apoio às ONGs</span></Container></div>
    </section>
  );
}

