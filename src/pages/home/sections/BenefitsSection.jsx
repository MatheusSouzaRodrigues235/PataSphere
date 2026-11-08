import { Col, Container, Row } from 'react-bootstrap';
import { benefits } from '../content';

export default function BenefitsSection() {
  return (
    <section className="section bg-white" id="beneficios" aria-labelledby="beneficios-titulo">
      <Container>
        <p className="eyebrow">Cuidar fica melhor quando é junto</p>
        <h2 id="beneficios-titulo">Tudo que a causa animal precisa em um só lugar</h2>
        <p className="section-lead">
          Estamos construindo ferramentas para simplificar a rotina de quem protege
          e facilitar o primeiro passo de quem quer ajudar.
        </p>

        <Row className="g-4 mt-2">
          {benefits.map(({ title, text, icon: Icon, tone }) => (
            <Col key={title} md={6} lg={3}>
              <article className="benefit-card h-100">
                <span className={`benefit-icon tone-${tone}`}>
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
