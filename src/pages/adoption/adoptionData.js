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
  .map(({ id, name, species, sex, ageLabel, size, urgency, photo, breed, color, photos }) => ({
    id, name, species, sex, ageLabel, size, photo, breed, color,
    photos: [...new Set([photo, ...(photos ?? [])])],
    urgent: urgency === 'Alta',
    puppy: ageLabel.endsWith('meses'),
    neighborhood: listings[name][0],
    description: listings[name][1],
    organization: 'Amor de Pet',
  }))
  .sort((first, second) => Number(second.urgent) - Number(first.urgent));

export const adoptionPath = ({ id }) => '/adocao/' + id;

export const adoptionDetails = {
  Thor: {
    code: '100245',
    introduction: 'Cão resgatado, pronto para conhecer uma nova família.',
    traits: ['Brincalhão', 'Carinhoso', 'Energético'],
    about: 'Thor é brincalhão, adora passear e se dá bem com crianças. Foi resgatado e hoje vive em lar temporário, onde aprendeu comandos básicos. Procura uma família que tenha tempo para brincar e passear.',
    care: 'Vacinado, vermifugado e castrado. Sem doenças conhecidas. Precisa de passeios diários e acompanhamento veterinário de rotina.',
  },
  Mimi: { care: 'Precisa de acompanhamento veterinário.' },
};

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
