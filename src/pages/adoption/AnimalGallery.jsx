import { useState } from 'react';
import AdoptionPhoto from './AdoptionPhoto';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function AnimalGallery({ name, photos, showSingleThumbnail = true }) {
  const [selected, setIndex] = useState(0);
  const index = Math.min(selected, Math.max(0, photos.length - 1));


  return (
    <section className="adoption-detail-panel adoption-gallery" aria-label={'Fotos de ' + name}>
      <div className="adoption-gallery-main">
        <AdoptionPhoto src={photos[index]} alt={photos.length ? name + ' — foto ' + (index + 1) : name} />
        {photos.length > 1 && (
          <>
            <button type="button" className="adoption-control" aria-label="Foto anterior" onClick={() => setIndex((index + photos.length - 1) % photos.length)}><FiChevronLeft aria-hidden="true" /></button>
            <button type="button" className="adoption-control" aria-label="Próxima foto" onClick={() => setIndex((index + 1) % photos.length)}><FiChevronRight aria-hidden="true" /></button>
          </>
        )}
      </div>
      {(showSingleThumbnail || photos.length > 1) && <div className="adoption-gallery-thumbnails">
        {photos.map((photo, position) => (
          <button key={photo} type="button" aria-pressed={index === position} aria-label={'Ver foto ' + (position + 1)} onClick={() => setIndex(position)}>
            <img src={photo} alt="" />
          </button>
        ))}
      </div>}
    </section>
  );
}
