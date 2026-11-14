import { LuPawPrint } from 'react-icons/lu';

export default function AdoptionPhoto({ src, alt, ...props }) {
  return src
    ? <img src={src} alt={alt} {...props} />
    : <span className="adoption-photo-placeholder" role={alt ? 'img' : undefined}
        aria-label={alt ? 'Sem foto de ' + alt : undefined} aria-hidden={!alt || undefined}>
        <LuPawPrint aria-hidden="true" />
      </span>;
}
