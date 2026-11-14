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

export async function manageAccount(action, fields) {
  const response = await fetch('/api/auth/' + action, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
  }).catch(() => { throw new Error('Não foi possível conectar ao PataSphere. Tente novamente.'); });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message ?? 'Não foi possível concluir a operação. Tente novamente.');
  return result;
}

export function endAccountSession() {
  return fetch('/api/auth/sair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
