function normalize(value) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function locationSearch(term) {
  const query = normalize(term.replace(/\b(\d{5})-(\d{3})\b/g, '$1$2'));
  const words = query ? query.split(' ') : [];

  return ({ cep, street, neighborhood, city, region }) => {
    if (!words.length) return true;
    const address = normalize([cep?.replace(/\D/g, ''), street, neighborhood, city, region].filter(Boolean).join(' '));
    return words.every((word) => address.includes(word));
  };
}
