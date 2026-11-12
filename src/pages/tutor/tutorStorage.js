import { exampleAlerts } from '@/pages/lost-animals/lostAnimalsData';

export const tutorStorageKey = 'patasphere-tutor-profile';
export const tutorAnimalsPath = '/perfil/tutor/animais';

export const tutorExampleAlerts = [
  ['mimi', 'lost', 'Jd. Satélite', '2026-10-28', false],
  ['thor', 'found', 'Centro', '2026-10-20', false],
  ['luna', 'lost', 'Vila Ema', '2026-10-02', true],
].map(([id, kind, neighborhood, date, closed]) => ({
  ...exampleAlerts.find((animal) => animal.id === id),
  id: 'tutor-' + id, kind, neighborhood, date, closed,
}));

export function readTutorData() {
  return JSON.parse(localStorage.getItem(tutorStorageKey)) ?? {};
}

export function readTutorAlerts() {
  try {
    return readTutorData().alerts ?? tutorExampleAlerts;
  } catch {
    return tutorExampleAlerts;
  }
}

export function saveTutorData(changes) {
  localStorage.setItem(tutorStorageKey, JSON.stringify({ ...readTutorData(), ...changes }));
}
