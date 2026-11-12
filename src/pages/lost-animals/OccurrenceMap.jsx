import { useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [-23.1896, -45.8841];
const tiles = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function MapSelection({ point, onChange }) {
  useMapEvents({ click: ({ latlng }) => onChange([latlng.lat, latlng.lng]) });

  return point && <CircleMarker center={point} radius={9} pathOptions={{ color: 'white', weight: 3, fillColor: '#bf4858', fillOpacity: 1, interactive: false }} />;
}

export default function OccurrenceMap({ point, onChange }) {
  const map = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  function selectCenter() {
    const center = map.current.getCenter();
    onChange([center.lat, center.lng]);
  }

  return (
    <section className="lost-registration-map" aria-labelledby="occurrence-map-title">
      <h2 id="occurrence-map-title">Marcar no mapa (opcional)</h2>
      <MapContainer ref={map} center={point ?? defaultCenter} zoom={13} maxZoom={19} scrollWheelZoom={false}>
        <TileLayer url={tiles} attribution={attribution} eventHandlers={{ tileerror: () => setUnavailable(true), tileload: () => setUnavailable(false) }} />
        <MapSelection point={point} onChange={onChange} />
      </MapContainer>
      <p role="status">{unavailable
        ? 'Parte do mapa está indisponível. Você pode continuar com o endereço preenchido.'
        : point ? 'Ponto marcado. Clique em outro local para ajustá-lo.' : 'Clique no mapa ou navegue com o teclado e marque o centro.'}</p>
      <div className="lost-registration-map-actions">
        <button type="button" className="adoption-control" onClick={selectCenter}>Marcar centro do mapa</button>
        {point && <button type="button" className="adoption-control" onClick={() => onChange(null)}>Remover ponto</button>}
      </div>
    </section>
  );
}
