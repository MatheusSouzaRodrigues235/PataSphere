import { useEffect, useState } from 'react';

export async function requestDonations(path = '', options) {
  const response = await fetch('/api/doacoes' + path, options).catch((error) => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao PataSphere. Tente novamente.');
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    throw new Error(result?.message ?? 'Não foi possível acessar as doações. Tente novamente.');
  }
  return result;
}

export function saveDonation(record, editing) {
  const { id, attachments, name, email, type, amount, unit, payment, description } = record;
  const form = new FormData();
  const retained = [];
  for (const attachment of attachments) {
    if (attachment.file) form.append('attachments', attachment.file);
    else retained.push(attachment.id);
  }
  form.set('donation', JSON.stringify({ name, email, type, amount, unit, payment, description, retained, ...(!editing && { key: id }) }));
  return requestDonations(editing ? '/' + id : '', { method: editing ? 'PATCH' : 'POST', body: form });
}

export function useDonations(connected) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!connected) return;
    const controller = new AbortController();
    requestDonations('', { signal: controller.signal }).then(
      ({ records }) => { if (!controller.signal.aborted) setResult({ records }); },
      (error) => { if (!controller.signal.aborted) setResult({ error: error.message }); },
    );
    return () => controller.abort();
  }, [connected, attempt]);

  return {
    records: result?.records,
    error: result?.error,
    loading: connected && !result,
    reload: () => { setResult(null); setAttempt((value) => value + 1); },
    updateRecords: (update) => setResult((previous) => ({ records: update(previous?.records ?? []) })),
  };
}
