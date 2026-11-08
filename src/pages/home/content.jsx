import { FiGrid, FiHeart, FiMapPin, FiSearch } from 'react-icons/fi';

// tone: 'rosa' | 'violeta' | 'laranja' | 'verde'
export const benefits = [
  {
    title: 'Adoção responsável',
    icon: FiHeart,
    tone: 'rosa',
    text: 'Um mural público reúne os animais disponíveis de todas as ONGs, com filtros por espécie, porte, sexo, urgência e local.',
  },
  {
    title: 'Animais perdidos e encontrados',
    icon: FiSearch,
    tone: 'violeta',
    text: 'Tutores e ONGs publicam alertas com foto, local e contato, para acelerar o reencontro.',
  },
  {
    title: 'Gestão simples para ONGs',
    icon: FiGrid,
    tone: 'laranja',
    text: 'Painel para cadastrar animais, acompanhar status e registrar doações financeiras e de insumos.',
  },
  {
    title: 'Alcance local, contato direto',
    icon: FiMapPin,
    tone: 'verde',
    text: 'Começamos por São José dos Campos. O interessado fala com a ONG pelo WhatsApp, com os dados já preenchidos.',
  },
];

export const steps = [
  { n: 1, title: 'Cadastre-se', text: 'ONGs e tutores criam a conta em poucos passos.' },
  { n: 2, title: 'Divulgue', text: 'Publique o animal para adoção ou o alerta de perdido, com fotos e detalhes.' },
  { n: 3, title: 'Conecte', text: 'Interessados enviam a solicitação e conversam direto pelo WhatsApp.' },
];

export const odsList = [
  { n: 3, label: 'Saúde e bem-estar' },
  { n: 15, label: 'Vida terrestre' },
];