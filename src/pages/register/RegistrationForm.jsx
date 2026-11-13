import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import RegistrationAccess from './RegistrationAccess';

export default function RegistrationForm({ title, intro, description, benefits, prompt, submitLabel, profile, children }) {
  const heading = useRef(null);
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    heading.current.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setFeedback('');
    setPending(true);
    const data = new FormData(event.currentTarget);
    if (data.get('logo')?.size === 0) data.delete('logo');

    try {
      const multipart = profile === 'ong';
      const response = await fetch('/api/cadastros/' + profile, {
        method: 'POST',
        headers: multipart ? undefined : { 'Content-Type': 'application/json' },
        body: multipart ? data : JSON.stringify(Object.fromEntries(data)),
      });
      const result = await response.json();
      if (!response.ok) {
        setFeedback(Object.values(result.fields ?? {}).join(' ') || result.message);
        return;
      }
      setFeedback('Cadastro concluído. Sua conta foi criada.');
    } catch {
      setFeedback('Não foi possível acessar o serviço de cadastro. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title={title} intro={intro} description={description} benefits={benefits}>
      <div className="register-content">
        <h1 id="auth-title" ref={heading} tabIndex={-1}>{title}</h1>
        <p className="auth-description">{prompt}</p>
        <form className="registration-form" onSubmit={handleSubmit} onChange={() => setFeedback('')}>
          {children}
          <RegistrationAccess />
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? 'Enviando…' : submitLabel}</button>
        </form>
        <p className="auth-feedback" role="status">{feedback}</p>
        <p className="auth-switch">
          Já tem conta? <Link to="/login" className="auth-action">Entrar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
