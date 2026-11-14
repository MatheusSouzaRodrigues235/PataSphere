import { useEffect, useState } from 'react';

export function useOrganizations(id) {
  const path = id === undefined ? '/api/ongs' : '/api/ongs/' + encodeURIComponent(id);
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(path, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 404 && id !== undefined) {
            if (!controller.signal.aborted) setResult({ path, attempt, missing: true });
            return;
          }
          throw new Error('Falha ao carregar ONGs');
        }
        if (!controller.signal.aborted) setResult({ path, attempt, data });
      } catch {
        if (!controller.signal.aborted) {
          setResult({ path, attempt, error: 'Não foi possível carregar as ONGs. Tente novamente.' });
        }
      }
    }
    load();
    return () => controller.abort();
  }, [id, path, attempt]);

  const current = result?.path === path && result.attempt === attempt ? result : null;
  return { ...current, loading: !current, reload: () => setAttempt((value) => value + 1) };
}
