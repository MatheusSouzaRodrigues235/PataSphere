import { Router } from 'express';

const cacheDuration = 60 * 60 * 1000;

export function geocodingRoutes({
  fetchPlaces = fetch,
  photonUrl = process.env.PHOTON_URL || 'https://photon.komoot.io/',
} = {}) {
  const router = Router();
  const cache = new Map();
  let upstreamRequests = 0;

  router.get('/', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().replace(/\s+/g, ' ') : '';
    if (query.length < 3 || query.length > 300) return res.status(400).json({ message: 'Informe um endereço válido.' });

    const fallback = typeof req.query.cep === 'string' && /^\d{5}-?\d{3}$/.test(req.query.cep)
      ? req.query.cep.replace('-', '') : '';
    const key = JSON.stringify([query.toLocaleLowerCase('pt-BR'), fallback]);
    let entry = cache.get(key);
    if (!entry || entry.expires <= Date.now()) {
      if (upstreamRequests >= 4) return res.status(503).json({ message: 'Consulta ao mapa temporariamente indisponível.' });
      const url = new URL('api/', photonUrl.endsWith('/') ? photonUrl : photonUrl + '/');


      upstreamRequests += 1;
      entry = {
        expires: Date.now() + cacheDuration,
        result: locateAddress(fetchPlaces, url, query, fallback).finally(() => { upstreamRequests -= 1; }),
      };
      if (cache.size >= 500) cache.delete(cache.keys().next().value);
      cache.set(key, entry);
    }

    try {
      res.set('Cache-Control', 'no-store').json(await entry.result);
    } catch {
      if (cache.get(key) === entry) cache.delete(key);
      res.status(502).json({ message: 'Não foi possível localizar o endereço no mapa.' });
    }
  });

  return router;
}

async function locateAddress(fetchPlaces, url, query, fallback) {
  if (!fallback || query.replace('-', '') === fallback) return locate(fetchPlaces, url, query);
  const primary = await locate(fetchPlaces, url, query).catch(() => null);
  if (primary?.point) return primary;
  return locate(fetchPlaces, url, fallback);
}

async function locate(fetchPlaces, baseUrl, query) {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams({ q: query, limit: '3', countrycode: 'BR' }).toString();
  const response = await fetchPlaces(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Falha na consulta ao Photon');
  const { features } = await response.json();
  const feature = features.find(({ geometry, properties }) => {
    const [lng, lat] = geometry?.coordinates ?? [];
    return properties?.countrycode === 'BR' && Number.isFinite(lat) && Number.isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  });
  if (!feature) return { point: null };
  const [lng, lat] = feature.geometry.coordinates;
  const { type, osm_value: kind } = feature.properties;
  return { point: [lat, lng], zoom: type === 'city' || ['city', 'town', 'village'].includes(kind) ? 13 : 16 };
}
