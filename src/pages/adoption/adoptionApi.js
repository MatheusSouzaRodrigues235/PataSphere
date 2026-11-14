import { useEffect, useState } from 'react';

export async function requestAdoption(path, { body, ...options } = {}) {
  const response = await fetch('/api/adocao' + path, {
    ...options,
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch((error) => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao PataSphere. Tente novamente.');
  });
  if (response.status === 204) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    const error = new Error(result?.message ?? 'Não foi possível acessar os animais. Tente novamente.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export function useAdoptionAnimals(path) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    let pending = false;

    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const data = await requestAdoption(path, { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ path, data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ path, error: error.message, status: error.status });
      } finally {
        pending = false;
      }
    }

    refresh();
    if (!path.startsWith('/meus')) window.addEventListener('focus', refresh);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
    };
  }, [path, attempt]);

  function updateAnimals(updater) {
    setResult((previous) => ({
      path, data: { animals: updater(previous?.path === path ? previous.data?.animals ?? [] : []) },
    }));
  }

  const current = result?.path === path ? result : null;
  return {
    updateAnimals, data: current?.data, error: current?.error, status: current?.status,
    loading: path !== null && !current, reload: () => setAttempt((value) => value + 1),
  };
}
