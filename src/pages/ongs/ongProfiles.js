export const ongProfiles = [
  {
    slug: 'amor-de-pet',
    name: 'Amor de Pet',
    tagline: 'Todo animal merece um lar',
    city: 'São José dos Campos – SP',
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
];

export const ongProfilePath = ({ slug }) => '/ongs/' + slug;
