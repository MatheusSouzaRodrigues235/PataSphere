import { exampleAlerts } from '@/pages/lost-animals/lostAnimalsData';

function tutorStorageKey(tutorId) {
  return tutorId ? 'patasphere-tutor-profile:' + tutorId : 'patasphere-tutor-profile';
}
export const tutorAnimalsPath = '/perfil/tutor/animais';

export const tutorExampleAlerts = [
  ['mimi', 'lost', 'Jd. Satélite', '2026-10-28', false],
  ['thor', 'found', 'Centro', '2026-10-20', false],
  ['luna', 'lost', 'Vila Ema', '2026-10-02', true],
].map(([id, kind, neighborhood, date, closed]) => ({
  ...exampleAlerts.find((animal) => animal.id === id),
  id: 'tutor-' + id, kind, neighborhood, date, closed,
}));

export function readTutorData(tutorId) {
  return JSON.parse(localStorage.getItem(tutorStorageKey(tutorId))) ?? {};
}

export function readTutorAlerts(tutorId) {
  const defaults = tutorId ? [] : tutorExampleAlerts;
  try {
    return readTutorData(tutorId).alerts ?? defaults;
  } catch {
    return defaults;
  }
}

export function saveTutorData(changes, tutorId) {
  localStorage.setItem(tutorStorageKey(tutorId), JSON.stringify({ ...readTutorData(tutorId), ...changes }));
}

export function resetTutorData(tutorId) {
  localStorage.removeItem(tutorStorageKey(tutorId));
}
