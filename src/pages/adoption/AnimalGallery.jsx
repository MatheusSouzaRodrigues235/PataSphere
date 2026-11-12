import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function AnimalGallery({ name, photos, showSingleThumbnail = true }) {
  const [index, setIndex] = useState(0);


  return (
    <section className="adoption-detail-panel adoption-gallery" aria-label={'Fotos de ' + name}>
      <div className="adoption-gallery-main">
        <img src={photos[index]} alt={name + ' — foto ' + (index + 1)} />
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
