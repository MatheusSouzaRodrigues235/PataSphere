import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [-23.1896, -45.8841];
const tiles = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function MapSelection({ onChange }) {
  useMapEvents({ click: ({ latlng }) => onChange([latlng.lat, latlng.lng]) });
  return null;
}

function MapView({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location?.point) map.setView(location.point, location.zoom ?? 16);
  }, [map, location]);
  return null;
}

export default function OccurrenceMap({ point, onChange, location, loading, error, onRetry }) {
  const map = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  const marker = point ?? location?.point;

  function selectCenter() {
    const center = map.current.getCenter();
    onChange([center.lat, center.lng]);
  }

  return (
    <section className="lost-registration-map" aria-label={onChange ? 'Mapa da ocorrência' : 'Mapa da localização'}>
      {onChange && <h2>Marcar no mapa (opcional)</h2>}
      <MapContainer ref={map} center={marker ?? defaultCenter} zoom={location?.zoom ?? (point ? 17 : 13)} maxZoom={19} scrollWheelZoom={false}>
        <TileLayer url={tiles} attribution={attribution} eventHandlers={{ tileerror: () => setUnavailable(true), tileload: () => setUnavailable(false) }} />
        <MapView location={location} />
        {onChange && <MapSelection onChange={onChange} />}
        {marker && <CircleMarker center={marker} radius={9}
          pathOptions={{ color: 'white', weight: 3, fillColor: '#bf4858', fillOpacity: 1, interactive: false }} />}
      </MapContainer>
      <p role="status">{unavailable
        ? 'Parte do mapa está indisponível. Você pode continuar com o endereço preenchido.'
        : loading ? 'Localizando o endereço…'
          : error || (location && !location.point) ? 'Não foi possível localizar o endereço automaticamente. Você pode marcar o ponto no mapa.'
          : onChange && (point ? 'Ponto marcado. Clique em outro local para ajustá-lo.'
            : location?.point ? 'Localização aproximada. Ajuste ou confirme o ponto no mapa.'
              : 'Clique no mapa ou navegue com o teclado e marque o centro.')}</p>
      {error && onRetry && <div><button type="button" className="adoption-control" disabled={loading}
        onClick={onRetry}>Tentar localizar novamente</button></div>}
      {onChange && <div className="lost-registration-map-actions">
        <button type="button" className="adoption-control" onClick={selectCenter}>{location?.point ? 'Confirmar centro do mapa' : 'Marcar centro do mapa'}</button>
        {point && <button type="button" className="adoption-control" onClick={() => onChange(null)}>Remover ponto</button>}
      </div>}
    </section>
  );
}
