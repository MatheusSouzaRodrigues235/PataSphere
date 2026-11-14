import { useRouteLoaderData } from 'react-router-dom';

export async function loadOngSession({ request }) {
  try {
    const response = await fetch('/api/auth/sessao', { signal: request.signal });
    if (response.ok) return (await response.json()).ong;
  } catch (error) {
    if (request.signal.aborted) throw error;
  }
  return null;
}

export function useOngSession() {
  return useRouteLoaderData('ong-session');
}

export function endOngSession() {
  return fetch('/api/auth/sair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
