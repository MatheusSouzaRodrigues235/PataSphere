import {
  LuCalendar, LuCamera, LuCheck, LuDna, LuHeart, LuOctagonAlert, LuPalette,
  LuPawPrint, LuRuler, LuSmile, LuType,
} from 'react-icons/lu';
import { TbGenderFemale } from 'react-icons/tb';
import { sexes, sizes, traits } from './animals';

export const filterGroups = [
  {
    label: 'Características físicas',
    color: 'purple',
    criteria: [
      { key: 'species', label: 'Espécie', icon: LuPawPrint, options: ['Cão', 'Gato'] },
      { key: 'breed', label: 'Raça', icon: LuDna, options: ['Sem raça definida', 'Jack Russell Terrier', 'Maine Coon'] },
      { key: 'size', label: 'Porte', icon: LuRuler, options: sizes },
      { key: 'color', label: 'Cor', icon: LuPalette, options: ['Tigrado', 'Tricolor', 'Laranja'] },
    ],
  },
  {
    label: 'Informações',
    color: 'orange',
    criteria: [
      { key: 'age', label: 'Idade', icon: LuCalendar, options: ['Filhote', 'Adulto', 'Idoso'] },
      { key: 'sex', label: 'Sexo', icon: TbGenderFemale, options: sexes },
      { key: 'medicalCare', label: 'Saúde', icon: LuHeart, options: [
        ['yes', 'Com cuidados médicos'], ['no', 'Sem cuidados médicos'],
      ] },
      { key: 'traits', label: 'Temperamento', icon: LuSmile, options: traits },
    ],
  },
  {
    label: 'Status',
    color: 'green',
    criteria: [
      { key: 'status', label: 'Status', icon: LuCheck, options: ['Disponível para adoção', 'Em tratamento', 'Adotado'] },
      { key: 'urgent', label: 'Urgência', icon: LuOctagonAlert, options: [
        ['yes', 'Urgente'], ['no', 'Sem urgência'],
      ] },
      { key: 'photo', label: 'Fotos', icon: LuCamera, options: [
        ['yes', 'Com fotos'], ['no', 'Sem fotos'],
      ] },
      { key: 'description', label: 'Descrição', icon: LuType, options: [
        ['yes', 'Com descrição'], ['no', 'Sem descrição'],
      ] },
    ],
  },
];

export function matchesAnimalFilters(animal, filters) {
  return Object.entries(filters).every(([key, value]) => {
    if (key === 'traits') return animal.traits.includes(value);
    if (key === 'photo' || key === 'description' || key === 'medicalCare') {
      return Boolean(animal[key]) === (value === 'yes');
    }
    if (key === 'urgent') return animal.urgent === (value === 'yes');
    return animal[key] === value;
  });
}
