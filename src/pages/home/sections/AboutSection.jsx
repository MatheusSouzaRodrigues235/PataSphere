import { Col, Container, Row } from 'react-bootstrap';
import { odsList } from '../content';

export default function AboutSection() {
  return (
    <section className="section about-section" aria-label="Sobre o PataSphere">
      <Container>
        <Row className="gx-4 gy-5">
          <Col md={6} id="quem-somos">
            <p className="eyebrow">Quem somos</p>
            <h2>Tecnologia a serviço de quem cuida</h2>
            <p className="mt-3">
              O PataSphere nasceu como projeto de Engenharia de Software da UNINTER, com
              foco em inclusão digital de ONGs e projetos sociais que hoje operam de forma
              limitada ou manual.
            </p>
            <p>
              A ideia é simples: oferecer uma infraestrutura moderna, fácil de usar até
              pelo celular, para que voluntários gastem menos tempo com burocracia e mais
              tempo com os animais.
            </p>
          </Col>

          <Col md={6} id="missao">
            <p className="eyebrow">Missão</p>
            <h2>Mais adoções, mais reencontros</h2>
            <p className="mt-3">
              Ampliar o alcance das campanhas de adoção responsável, apoiar a saúde
              financeira das ONGs e monitorar urgências e status de saúde dos animais.
            </p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              {odsList.map((o) => (
                <span key={o.n} className="ods-chip">
                  <b>{o.n}</b>
                  {o.label}
                </span>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

