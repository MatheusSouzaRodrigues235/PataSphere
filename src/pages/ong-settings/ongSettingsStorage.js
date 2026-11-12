export const ongSettingsPath = '/perfil/ong';
export const ongPreviewPath = '/ongs/amor-de-pet/previa';
const storageKey = 'patasphere-ong-profile';

export const initialSettings = {
  profile: {
    name: 'Amor de Pet', cnpj: '', founded: '', tagline: '', bio: '', email: '',
    whatsapp: '', cep: '', city: '', state: 'São Paulo', website: '', instagram: '', facebook: '', pixKey: '',
  },
  images: { logo: '', cover: '' },
  donations: { supplies: '' },
  notifications: { adoption: true, sightings: true, donations: true, news: false },
  privacy: { contact: true, location: true },
};

export function readOngSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return Object.fromEntries(Object.entries(initialSettings).map(([key, defaults]) => [
      key, { ...defaults, ...stored?.[key] },
    ]));
  } catch {
    return initialSettings;
  }
}

export function writeOngSettings(settings) {
  if (settings) localStorage.setItem(storageKey, JSON.stringify(settings));
  else localStorage.removeItem(storageKey);
}
