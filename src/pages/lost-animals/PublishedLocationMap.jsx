import { lazy, Suspense } from 'react';
import useMapLocation from '@/app/useMapLocation';
import '@/styles/_lost-registration.scss';

const OccurrenceMap = lazy(() => import('./OccurrenceMap'));

export default function PublishedLocationMap({ point, address, cep = '' }) {
  const { location, loading, error, retry } = useMapLocation(point ? '' : address, cep);
  const center = point ?? location?.point;
  const url = center
    ? 'https://www.openstreetmap.org/?mlat=' + center[0] + '&mlon=' + center[1] + '#map=' + (point ? 17 : location?.zoom ?? 16) + '/' + center.join('/')
    : 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(address);

  return (
    <div>
      {loading && <p role="status">Localizando no mapa…</p>}
      {center && <Suspense fallback={<p role="status">Carregando mapa…</p>}>
        <OccurrenceMap point={point} location={location} />
      </Suspense>}
      {center && !point && <p className="mb-1">Localização aproximada.</p>}
      {(error || (location && !center)) && <p role="status">Não foi possível localizar o endereço na prévia do mapa.</p>}
      {error && !loading && <button type="button" className="adoption-control" onClick={retry}>Tentar localizar novamente</button>}
      {(center || address) && <a className="adoption-control mt-2" href={url} target="_blank" rel="noreferrer">
        Ver no OpenStreetMap
      </a>}
    </div>
  );
}
