import { sizes, species, urgencies } from '@/pages/dashboard/animals';

export const adoptionPath = ({ id }) => '/adocao/' + id;

export const quickFilters = [
  ['Todos', {}],
  ['Cães', { species: 'Cão' }],
  ['Gatos', { species: 'Gato' }],
  ['Urgência alta', { urgency: 'Alta' }],
  ['Filhotes', { puppy: true }],
  ['Porte pequeno', { size: 'Pequeno' }],
  ['Porte médio', { size: 'Médio' }],
  ['Porte grande', { size: 'Grande' }],
];

export const filterGroups = [
  ['species', 'Espécie', species],
  ['size', 'Porte', sizes],
  ['sex', 'Sexo', ['Macho', 'Fêmea']],
  ['urgency', 'Urgência', urgencies],
];
