import { Link, NavLink } from 'react-router-dom';
import { FiGithub, FiUser } from 'react-icons/fi';
import logo from '@/assets/logo-patasphere.svg';

export function AdoptionHeader({ showAccountActions = false }) {
  return (
    <header className="adoption-header">
      <Link to="/" aria-label="PataSphere, página inicial"><img src={logo} alt="" width="44" height="44" /></Link>
      <nav aria-label="Menu principal">
        <Link to="/">Home</Link>
        <NavLink to="/animais-perdidos">Animais perdidos</NavLink>
        <NavLink to="/adocao">Adotar um animal</NavLink>
        <NavLink to="/ongs">Visualizar ONGs</NavLink>
        {showAccountActions ? (
          <>
            <Link className="adoption-control adoption-account-link" to="/login">Entrar</Link>
            <Link className="adoption-action adoption-account-link" to="/cadastro">Cadastrar</Link>
          </>
        ) : (
          <Link className="adoption-control" to="/login" aria-label="Acessar conta"><FiUser aria-hidden="true" /></Link>
        )}
      </nav>
    </header>
  );
}

export function AdoptionFooter({ showLostAnimals = false }) {
  return (
    <footer className="adoption-footer">
      <div className="adoption-footer-inner">
        <div className={showLostAnimals ? 'adoption-footer-columns ong-directory-footer' : 'adoption-footer-columns'}>
          <div>
            <Link to="/" aria-label="PataSphere, página inicial"><img src={logo} alt="" width="48" height="48" /></Link>
            <p>Sistema de informação para gestão de entidades protetoras e intermediação de adoção e resgate de animais.</p>
          </div>
          <div>
            <h2>Institucional</h2>
            <a href="/#quem-somos">O que é o projeto</a>
            <a href="/#como-funciona">Como funciona</a>
          </div>
          <div>
            <h2>Adotar</h2>
            <Link to="/adocao">Busca de adoção</Link>
            <Link to="/adocao?species=C%C3%A3o">Adoção cachorro</Link>
            <Link to="/adocao?species=Gato">Adoção gato</Link>
          </div>
          {showLostAnimals && (
            <div>
              <h2>Animais perdidos</h2>
              <Link to="/animais-perdidos/cadastro">Cadastrar</Link>
              <Link to="/animais-perdidos">Lista de animais</Link>
            </div>
          )}
          <div>
            <h2>ONGs</h2>
            <Link to="/cadastro/ong">Cadastrar ONG</Link>
            <Link to="/ongs">Ver ONGs</Link>
          </div>
        </div>
        <div className="adoption-footer-bottom">
          <span>PataSphere – Trabalho acadêmico (Matheus Souza Rodrigues · UNINTER)</span>
          <a href="https://github.com/MatheusSouzaRodrigues235/PataSphere"><FiGithub aria-hidden="true" /> GitHub</a>
        </div>
      </div>
    </footer>
  );
}
