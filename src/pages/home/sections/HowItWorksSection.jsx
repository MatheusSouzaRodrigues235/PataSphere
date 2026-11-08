import { Container } from 'react-bootstrap';
import { steps } from '../content';

export default function HowItWorksSection() {
  return (
    <section className="section bg-white" id="como-funciona" aria-labelledby="como-funciona-titulo">
      <Container>
        <p className="eyebrow">Como funciona</p>
        <h2 id="como-funciona-titulo">Uma conexão pode mudar tudo.</h2>
        <p className="section-lead">Veja como vai funcionar quando a plataforma estiver disponível.</p>

        <ol className="steps-grid list-unstyled mt-5 mb-0">
          {steps.map((s) => (
            <li key={s.n} className="step-card">
              <span className="step-number" aria-hidden="true">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
