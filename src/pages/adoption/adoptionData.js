import { initialAnimals } from '@/pages/dashboard/animals';

const listings = {
  Thor: ['Jd. Satélite', 'Brincalhão e muito carinhoso. Já é vacinado e castrado.'],
  Mimi: ['Centro', 'Independente e tranquila. Precisa de acompanhamento veterinário.'],
  Marshmallow: ['Vila Industrial', 'Energética, ótima com crianças e outros cães.'],
  Gilson: ['Jd. Esplanada', 'Calmo, gosta de colo e de janelas ensolaradas.'],
  Luna: ['Bosque dos Eucaliptos', 'Brincalhona e curiosa. Convive bem com outros gatos.'],
  Bento: ['Jd. Aquarius', 'Obediente e protetor. Procura um lar com quintal.'],
  Nina: ['Vila Ema', 'Filhote sociável, já come ração sozinha.'],
  Simba: ['Jd. das Indústrias', 'Independente, acostumado a apartamento.'],
  Mel: ['Jardim América', 'Carinhosa e animada. Adora passear.'],
  Chico: ['Vila Adyana', 'Sociável e tranquilo. Gosta de descansar ao sol.'],
};

export const adoptionAnimals = initialAnimals
  .filter(({ name }) => Object.hasOwn(listings, name))
  .map(({ id, name, species, sex, ageLabel, size, urgency, photo }) => ({
    id, name, species, sex, ageLabel, size, photo,
    urgent: urgency === 'Alta',
    puppy: ageLabel.endsWith('meses'),
    neighborhood: listings[name][0],
    description: listings[name][1],
    organization: 'Amor de Pet',
  }))
  .sort((first, second) => Number(second.urgent) - Number(first.urgent));

export const quickFilters = [
  ['Todos', {}],
  ['Cães', { species: 'Cão' }],
  ['Gatos', { species: 'Gato' }],
  ['Urgência alta', { urgent: true }],
  ['Filhotes', { puppy: true }],
  ['Porte pequeno', { size: 'Pequeno' }],
  ['Porte médio', { size: 'Médio' }],
  ['Porte grande', { size: 'Grande' }],
];

export const filterFields = [
  ['species', 'Espécie', ['Cão', 'Gato']],
  ['size', 'Porte', ['Pequeno', 'Médio', 'Grande']],
  ['sex', 'Sexo', ['Fêmea', 'Macho']],
  ['neighborhood', 'Bairro', adoptionAnimals.map(({ neighborhood }) => neighborhood).sort((a, b) => a.localeCompare(b, 'pt-BR'))],
];
