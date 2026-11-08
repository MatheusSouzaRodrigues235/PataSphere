import { FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-patasphere.svg';

export default function AuthLayout({ title, intro, description, benefits, children }) {
  return (
    <main className="auth-page">
      <title>{`${title} | PataSphere`}</title>
      <aside className="auth-intro" aria-labelledby="auth-intro-title">
        <div>
          <Link to="/" className="auth-logo" aria-label="PataSphere, página inicial">
            <img src={logo} alt="" width={64} height={64} />
          </Link>
          <h2 id="auth-intro-title">{intro}</h2>
          <p className="auth-intro-text">{description}</p>
          <ul className="auth-benefits" role="list">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <span className="auth-benefit-icon"><FiCheck aria-hidden="true" /></span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-credit">PataSphere – Trabalho acadêmico · UNINTER</p>
      </aside>
      <section className="auth-panel" aria-labelledby="auth-title">
        {children}
      </section>
    </main>
  );
}
