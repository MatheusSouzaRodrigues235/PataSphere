import mimi from '@/assets/dashboard/mimi.jpg';
import marshmallow from '@/assets/dashboard/marshmallow.jpg';
import gilson from '@/assets/dashboard/gilson.jpg';

export const sizes = ['Pequeno', 'Médio', 'Grande'];
export const sexes = ['Fêmea', 'Macho'];
export const traits = ['Independente', 'Brincalhão', 'Energético'];

const examples = [
  {
    name: 'Mimi', sex: 'Fêmea', photo: mimi, medicalCare: true, traits,
    species: 'Gato', breed: 'Sem raça definida', color: 'Tigrado', age: 'Adulto',
    status: 'Em tratamento', urgent: true, description: 'Gata que precisa de cuidados médicos.',
  },
  {
    name: 'Marshmallow', sex: 'Fêmea', photo: marshmallow, traits,
    species: 'Cão', breed: 'Jack Russell Terrier', color: 'Tricolor', age: 'Filhote',
    status: 'Disponível para adoção', urgent: false, description: 'Cadela brincalhona e energética.',
  },
  {
    name: 'Gilson', sex: 'Macho', photo: gilson, traits: traits.slice(1),
    species: 'Gato', breed: 'Maine Coon', color: 'Laranja', age: 'Idoso',
    status: 'Disponível para adoção', urgent: false,
  },
];

export const initialAnimals = Array.from({ length: 3 }, (_, row) =>
  examples.map((animal, column) => ({ ...animal, id: row * 3 + column, size: 'Médio' })),
).flat();
