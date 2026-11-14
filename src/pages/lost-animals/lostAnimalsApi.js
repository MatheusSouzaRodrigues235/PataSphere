import { useCallback, useEffect, useState } from 'react';

export const sightingsInboxPath = '/avistamentos';

export const isPublishedAlert = (id) => /^ocorrencia-[1-9]\d*$/.test(id);

export async function requestLostAnimals(path, { body, ...options } = {}) {
  const response = await fetch('/api/animais-perdidos' + path, {
    ...options,
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch((error) => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao PataSphere. Tente novamente.');
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    throw new Error(result?.message ?? 'Não foi possível acessar os anúncios. Tente novamente.');
  }
  return result;
}

export function useLostAnimals(path, { live = false } = {}) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    let pending = false;

    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const data = await requestLostAnimals(path, { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ path, data, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult((previous) => ({
            path, data: previous?.path === path ? previous.data : null,
            error: error.message,
          }));
        }
      } finally {
        pending = false;
      }
    }

    refresh();
    const timer = live ? window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 15_000) : null;
    if (live) window.addEventListener('focus', refresh);
    if (path === '/avistamentos/nao-lidos') window.addEventListener('patasphere:sightings-changed', refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('patasphere:sightings-changed', refresh);
    };
  }, [path, live, attempt]);

  const current = result?.path === path ? result : null;
  return { data: current?.data, error: current?.error, loading: path !== null && !current, reload };
}
