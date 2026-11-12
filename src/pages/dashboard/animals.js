import mimi from '@/assets/dashboard/mimi.jpg';
import marshmallow from '@/assets/dashboard/marshmallow.jpg';
import gilson from '@/assets/dashboard/gilson.jpg';

export const sizes = ['Pequeno', 'Médio', 'Grande'];
export const sexes = ['Fêmea', 'Macho'];
export const traits = ['Independente', 'Brincalhão', 'Energético'];
export const species = ['Cão', 'Gato', 'Outro'];
export const ages = ['Até 1 ano', '1 a 3 anos', '4 a 7 anos', '8 anos ou mais', 'Não informada'];
export const urgencies = ['Alta', 'Média', 'Baixa'];
export const statuses = [
  { label: 'Disponível', tab: 'Disponíveis', tone: 'green', detail: 'Aparece no mural público' },
  { label: 'Em tratamento', tab: 'Em tratamento', tone: 'yellow', detail: 'Aparece com aviso de cuidados médicos' },
  { label: 'Em processo de adoção', tab: 'Em processo de adoção', tone: 'purple', detail: 'Continua visível, mas reservado' },
  { label: 'Adotado', tab: 'Adotados', tone: 'neutral', detail: 'Sai do mural público' },
];

const examples = [
  ['Thor', 'Cão', 'Macho', '2 anos', 'Médio', 0, 'Alta', '28', marshmallow, 1],
  ['Mimi', 'Gato', 'Fêmea', '1 ano', 'Médio', 1, 'Alta', '27', mimi, 1],
  ['Marshmallow', 'Cão', 'Fêmea', '8 meses', 'Pequeno', 0, 'Média', '25', marshmallow, 0],
  ['Gilson', 'Gato', 'Macho', '3 anos', 'Médio', 2, 'Baixa', '22', gilson, 1],
  ['Luna', 'Gato', 'Fêmea', '1 ano', 'Pequeno', 0, 'Média', '20', gilson, 1],
  ['Bento', 'Cão', 'Macho', '4 anos', 'Grande', 3, 'Baixa', '15', marshmallow, 2],
  ['Nina', 'Gato', 'Fêmea', '6 meses', 'Pequeno', 0, 'Média', '12', mimi, 0],
  ['Simba', 'Gato', 'Macho', '2 anos', 'Médio', 3, 'Baixa', '08', gilson, 1],
  ['Mel', 'Cão', 'Fêmea', '2 anos', 'Médio', 0, 'Baixa', '06', marshmallow, 1],
  ['Amora', 'Gato', 'Fêmea', '5 meses', 'Pequeno', 1, 'Alta', '04', mimi, 0],
  ['Chico', 'Gato', 'Macho', '5 anos', 'Médio', 0, 'Média', '03', gilson, 2],
  ['Pipoca', 'Cão', 'Fêmea', '3 anos', 'Pequeno', 2, 'Baixa', '02', marshmallow, 1],
];

const exampleDetails = {
  Thor: {
    breed: 'Sem raça definida',
    color: 'Caramelo',
    health: 'Vacinado e castrado',
    temperament: 'Brincalhão, carinhoso',
    description: 'Thor é brincalhão, adora passear e se dá bem com crianças.',
    photos: [marshmallow, marshmallow],
  },
  Mimi: { breed: 'Sem raça definida', color: 'Tigrado', description: 'Gata que precisa de cuidados médicos.' },
  Marshmallow: { breed: 'Jack Russell Terrier', color: 'Tricolor', description: 'Cadela brincalhona e energética.' },
  Gilson: { breed: 'Maine Coon', color: 'Laranja' },
};

export const initialAnimals = examples.map(
  ([name, species, sex, ageLabel, size, statusIndex, urgency, day, photo, ageIndex], id) => ({
    id,
    name,
    species,
    sex,
    ageLabel,
    age: ages[ageIndex],
    size,
    status: statuses[statusIndex].label,
    urgency,
    medicalCare: statusIndex === 1,
    registeredAt: `${day}/10/2026`,
    photo,
    traits,
    ...exampleDetails[name],
  }),
);
