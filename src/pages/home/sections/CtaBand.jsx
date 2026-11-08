import { Button, Container } from 'react-bootstrap';
import { FiArrowUpRight, FiHeart } from 'react-icons/fi';
export default function CtaBand() {
  return <section className="section cta-section" id="para-ongs" aria-labelledby="ongs-titulo"><Container><div className="cta-band"><div><p className="eyebrow">Para quem faz a diferença</p><h2 id="ongs-titulo">Sua ONG cuida de vidas.<br />A gente quer ajudar a cuidar do resto.</h2><p>Uma proposta para organizar a rotina, dar visibilidade aos animais e aproximar pessoas da sua causa.</p><Button href="#como-funciona" variant="light" size="lg">Conheça a proposta <FiArrowUpRight aria-hidden="true" /></Button><span className="project-note">Projeto acadêmico em desenvolvimento. Cadastros em breve.</span></div><FiHeart className="cta-heart" aria-hidden="true" /></div></Container></section>;
}
