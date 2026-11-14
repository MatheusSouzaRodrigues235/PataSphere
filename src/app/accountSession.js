import { useRouteLoaderData } from 'react-router-dom';

export async function loadAccountSession({ request }) {
  try {
    const response = await fetch('/api/auth/sessao', { signal: request.signal });
    if (response.ok) return (await response.json()).account ?? null;
  } catch (error) {
    if (request.signal.aborted) throw error;
  }
  return null;
}

export function useAccountSession() {
  return useRouteLoaderData('account-session');
}

export function useOngSession() {
  const account = useAccountSession();
  return account?.role === 'ong' ? account : null;
}

export function useTutorSession() {
  const account = useAccountSession();
  return account?.role === 'tutor' ? account : null;
}

export function endAccountSession() {
  return fetch('/api/auth/sair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
