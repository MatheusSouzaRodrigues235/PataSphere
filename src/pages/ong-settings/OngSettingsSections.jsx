import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ongSettingsPath } from './ongSettingsStorage';

export function OngImages({ images, save }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(event) {
    const { name, files } = event.target;
    const file = files[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Escolha um arquivo JPG, PNG ou WebP de até 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const max = name === 'logo' ? 320 : 1440;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      try {
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      } finally {
        image.close();
      }
      save((current) => ({ images: { ...current.images, [name]: canvas.toDataURL('image/webp', 0.85) } }),
        'Imagem atualizada neste navegador.');
    } catch {
      setError('Não foi possível abrir a imagem.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tutor-body ong-settings-images">
      <p>Escolha imagens JPG, PNG ou WebP de até 5 MB.</p>
      {Object.entries({ logo: 'Logo da ONG', cover: 'Foto de capa' }).map(([name, label]) => (
        <div className="tutor-field" key={name}>
          <label htmlFor={'ong-image-' + name}>{label}</label>
          {images[name] && <img className={'ong-settings-' + name} src={images[name]} alt={label} />}
          <input id={'ong-image-' + name} type="file" name={name} disabled={busy}
            accept="image/jpeg,image/png,image/webp" onChange={upload} />
          {images[name] && (
            <button className="btn btn-outline-danger" type="button" disabled={busy} onClick={() => {
              setError('');
              save({ images: { ...images, [name]: '' } }, 'Imagem removida.');
            }}>Remover {name === 'logo' ? 'logo' : 'foto'}</button>
          )}
        </div>
      ))}
      {error && <p className="tutor-error" role="alert">{error}</p>}
    </div>
  );
}

export function OngReceiving({ data, save }) {
  const [supplies, setSupplies] = useState(data.donations.supplies);
  return (
    <form className="tutor-body" onSubmit={(event) => {
      event.preventDefault();
      const next = supplies.trim();
      if (save({ donations: { supplies: next } }, 'Formas de recebimento salvas neste navegador.')) setSupplies(next);
    }}>
      <fieldset>
        <legend>Doações via Pix</legend>
        <p>{data.profile.pixKey || 'Cadastre uma chave Pix para exibir a opção de doação na prévia.'}</p>
        <Link to={ongSettingsPath}>{data.profile.pixKey ? 'Editar chave Pix' : 'Cadastrar chave Pix'}</Link>
      </fieldset>
      <fieldset>
        <legend>Doações de insumos</legend>
        <div className="tutor-field">
          <label htmlFor="ong-supplies">Itens que a ONG precisa</label>
          <textarea id="ong-supplies" value={supplies} onChange={(event) => setSupplies(event.target.value)}
            rows={5} maxLength={600} placeholder={'Ração\nMedicamentos\nCobertores'} aria-describedby="ong-supplies-hint" />
          <small id="ong-supplies-hint">Digite um item por linha para exibi-los na seção Como ajudar da prévia.</small>
        </div>
      </fieldset>
      <button className="btn btn-primary" type="submit">Salvar</button>
    </form>
  );
}
