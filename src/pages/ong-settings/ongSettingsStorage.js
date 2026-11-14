export const ongSettingsPath = '/perfil/ong';
export const ongPreviewPath = '/ongs/previa';
const storageKey = 'patasphere-ong-profile';

export const initialSettings = {
  profile: {
    name: 'Amor de Pet', cnpj: '', founded: '', tagline: '', bio: '', email: '',
    whatsapp: '', cep: '', city: '', state: 'São Paulo', website: '', instagram: '', facebook: '', pixKey: '',
  },
  images: { logo: '', cover: '' },
  donations: { supplies: '', instructions: '' },
  notifications: { adoption: true, sightings: true, donations: true, news: false },
  privacy: { contact: true, location: true },
};

export function readOngSettings(ong) {
  const key = ong ? storageKey + ':' + ong.id : storageKey;
  const defaults = ong ? {
    ...initialSettings,
    profile: {
      ...initialSettings.profile, name: ong.name, cnpj: ong.cnpj, email: ong.email,
      whatsapp: ong.phone, cep: ong.cep, city: ong.city, state: ong.state,
    },
    images: { ...initialSettings.images, logo: ong.photo ?? '' },
  } : initialSettings;
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return Object.fromEntries(Object.entries(defaults).map(([section, values]) => [
      section, { ...values, ...stored?.[section] },
    ]));
  } catch {
    return defaults;
  }
}

export function writeOngSettings(settings, ong) {
  const key = ong ? storageKey + ':' + ong.id : storageKey;
  if (settings) localStorage.setItem(key, JSON.stringify(settings));
  else localStorage.removeItem(key);
}
