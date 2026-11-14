const dayLength = 86_400_000;

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') || value.startsWith('0000')) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function occurrenceDateError({ de, ate }) {
  if ((de && !validDate(de)) || (ate && !validDate(ate))) return 'Informe datas válidas.';
  if (de && ate && de > ate) return 'A data inicial deve ser anterior ou igual à data final.';
  return '';
}

export function matchesOccurrenceDate(date, { de, ate, recent }, today) {
  const daysAgo = (Date.parse(today) - Date.parse(date)) / dayLength;
  return (!de || date >= de) && (!ate || date <= ate) && (!recent || (daysAgo >= 0 && daysAgo < 7));
}
