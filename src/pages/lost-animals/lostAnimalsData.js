import { initialAnimals, sexes, sizes, species } from '@/pages/dashboard/animals';

export const lostAnimalsPath = '/animais-perdidos';

const examples = [
  ['Mimi', 'Jardim Satélite', 2, 'Tem pelagem tigrada e atende pelo nome.'],
  ['Thor', 'Jardim Esplanada', 3, 'Usava uma coleira azul quando desapareceu.'],
  ['Luna', 'Vila Ema', 5, 'É pequena e costuma se esconder quando assustada.'],
  ['Bento', 'Jardim Aquarius', 7, 'Usava uma coleira vermelha.'],
  ['Nina', 'Jardim América', 9, 'Tem uma mancha clara no peito.'],
  ['Gilson', 'Centro', 14, 'Tem pelagem longa e é dócil.'],
  ['Mel', 'Vila Industrial', 16, 'É sociável e atende pelo nome.'],
  ['Simba', 'Jardim das Indústrias', 21, 'Costuma se esconder em garagens.'],
  ['Amora', 'Vila Adyana', 22, 'É filhote e se assusta com barulhos.'],
  ['Pipoca', 'Bosque dos Eucaliptos', 24, 'Usava uma guia verde.'],
];

const today = new Date();
today.setHours(0, 0, 0, 0);
export const localDate = (date) => date.toLocaleDateString('sv-SE');
export const todayDate = localDate(today);

export const exampleAlerts = examples.map(([name, neighborhood, days, description]) => {
  const { species, sex, size, ageLabel, breed, photo } = initialAnimals.find((animal) => animal.name === name);
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return {
    id: name.toLowerCase(), name, species, sex, size, ageLabel, breed, photo,
    neighborhood, description, city: 'São José dos Campos', date: localDate(date), example: true,
  };
});

export const animalFields = [
  ['species', 'Espécie', species],
  ['size', 'Porte', sizes],
  ['sex', 'Sexo', sexes],
];

export function formatAlertDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));
}

export function timeSince(date) {
  const days = Math.round((Date.parse(todayDate) - Date.parse(date)) / 86_400_000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  const format = new Intl.RelativeTimeFormat('pt-BR');
  return days < 7 ? format.format(-days, 'day') : format.format(-Math.floor(days / 7), 'week');
}
