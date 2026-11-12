const city = 'São José dos Campos';

export const ongProfiles = [
  {
    slug: 'amor-de-pet',
    name: 'Amor de Pet',
    tagline: 'Todo animal merece um lar',
    city: city + ' – SP',
    neighborhood: 'Jd. Satélite',
    color: '#bf4858',
    founded: 2015,
    adopted: 87,
    description: 'A Amor de Pet resgata, cuida e encontra novos lares para cães e gatos em situação de vulnerabilidade em São José dos Campos. Nosso trabalho depende de adotantes responsáveis, de doações e de muita divulgação.',
    featured: ['Thor', 'Mimi', 'Marshmallow', 'Gilson'],
    address: 'Rua Exemplo, 120 – Jd. Satélite',
    whatsapp: '(12) 99999-9999',
    pixKey: '00.000.000/0000-00',
    email: 'contato@amordepet.org.br',
    instagram: 'instagram.com/amordepet',
    website: 'amordepet.org.br',
    supplies: ['Ração', 'Medicamentos', 'Cobertores'],
  },
  ...[
    ['instituto-adota-pet-sjc', 'Instituto Adota Pet SJC', 'Adoção responsável', 'Centro', '#2b3440', 'O instituto incentiva a adoção responsável e ajuda animais resgatados a encontrar novas famílias.'],
    ['patas-amigas', 'Patas Amigas', 'Resgate e cuidado', 'Vila Industrial', '#1d6b3a', 'A Patas Amigas atua no resgate e no cuidado de animais em situação de vulnerabilidade.'],
    ['lar-dos-bichos', 'Lar dos Bichos', 'Um novo começo', 'Jd. Esplanada', '#98410c', 'O Lar dos Bichos acolhe animais resgatados enquanto aguardam a adoção.'],
    ['resgate-vida-animal', 'Resgate Vida Animal', 'Vidas salvas', 'Bosque dos Eucaliptos', '#572d9f', 'O Resgate Vida Animal atua no acolhimento de animais e na divulgação de adoções.'],
    ['anjos-de-quatro-patas', 'Anjos de Quatro Patas', 'Amor em quatro patas', 'Jd. Aquarius', '#225a95', 'A Anjos de Quatro Patas promove o cuidado com animais e incentiva a adoção responsável.'],
    ['abrigo-patas-do-vale', 'Abrigo Patas do Vale', 'Acolhimento e proteção', 'Vila Ema', '#356763', 'O abrigo oferece acolhimento temporário a cães e gatos resgatados.'],
    ['rede-novo-lar', 'Rede Novo Lar', 'Uma família para cada animal', 'Jd. das Indústrias', '#8a4266', 'A rede mobiliza voluntários para acolher animais resgatados e divulgar adoções.'],
  ].map(([slug, name, tagline, neighborhood, color, description]) => ({
    slug, name, tagline, neighborhood, color, description, city: city + ' – SP',
  })),
];

export const ongProfilePath = ({ slug }) => '/ongs/' + slug;
export const ongAdoptionSearch = ({ name }) => new URLSearchParams({ ong: name }).toString();
