import { useRef, useState } from 'react';
import { useRevalidator } from 'react-router-dom';

export function readLegacyProfile(role, id) {
  try {
    return JSON.parse(localStorage.getItem('patasphere-' + role + '-profile:' + id)) ?? {};
  } catch {
    return {};
  }
}

export function legacyProfileChanges(section, stored, settings) {
  if (section === 'perfil' && stored.profile) {
    return { profile: { ...settings.profile, ...stored.profile, ...(settings.profile.cnpj && { cnpj: stored.profile.cnpj || settings.profile.cnpj }) } };
  }
  if (section === 'notificacoes' && stored.notifications) {
    return { notifications: { ...settings.notifications, ...stored.notifications } };
  }
  if (section === 'privacidade' && stored.privacy) {
    return { privacy: { ...settings.privacy, ...stored.privacy } };
  }
  if (section === 'recebimento' && stored.donations) {
    return { donations: { ...settings.donations, ...stored.donations } };
  }
  if (section === 'foto' && typeof stored.photo === 'string') return { photo: stored.photo };
  return null;
}

export async function requestProfile(role, { changes, signal } = {}) {
  const response = await fetch('/api/perfis/' + role, {
    signal,
    ...(changes && {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    }),
  }).catch((error) => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao PataSphere. Tente novamente.');
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.settings) {
    throw new Error(body?.message ?? 'Não foi possível acessar os dados do perfil.');
  }
  return body.settings;
}

export function profileLoader(role) {
  return async ({ request }) => {
    try {
      return { settings: await requestProfile(role, { signal: request.signal }) };
    } catch (error) {
      if (request.signal.aborted) throw error;
      return { error: error.message };
    }
  };
}

export function useProfileSave(role, section, setData, saveLocal) {
  const { revalidate } = useRevalidator();
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function save(changes, message = 'Perfil salvo.') {
    if (saveLocal) return saveLocal(changes, message);
    if (pending.current) return false;
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      setData(await requestProfile(role, { changes }));
      void revalidate();
      setFeedback({ section, message });
      return true;
    } catch (error) {
      setFeedback({ section, message: error.message, error: true });
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return { save, saving, feedback, setFeedback };
}
