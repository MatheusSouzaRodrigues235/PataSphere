import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import RegistrationAccess from './RegistrationAccess';

export default function RegistrationForm({ title, intro, description, benefits, prompt, submitLabel, children }) {
  const heading = useRef(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    heading.current.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('Formulário validado. A criação de contas estará disponível em uma próxima etapa.');
  }

  return (
    <AuthLayout title={title} intro={intro} description={description} benefits={benefits}>
      <div className="register-content">
        <h1 id="auth-title" ref={heading} tabIndex={-1}>{title}</h1>
        <p className="auth-description">{prompt}</p>
        <form className="registration-form" onSubmit={handleSubmit} onChange={() => setFeedback('')}>
          {children}
          <RegistrationAccess />
          <button className="auth-submit" type="submit">{submitLabel}</button>
        </form>
        <p className="auth-feedback" role="status">{feedback}</p>
        <p className="auth-switch">
          Já tem conta? <Link to="/login" className="auth-action">Entrar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
