import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiCamera } from 'react-icons/fi';
import AuthPasswordInput from '@/components/layout/AuthPasswordInput';

function Bio({ text }) {
  return <p className="tutor-bio">{text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, index) => {
    if (index % 2 === 0) return part;
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <em key={index}>{part.slice(1, -1)}</em>;
  })}</p>;
}

export function TutorPreview({ data, avatar }) {
  const { profile, privacy } = data;
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const instagram = profile.instagram.trim().replace(/^@/, '');
  const facebook = profile.facebook.trim().replace(/^@/, '');
  return (
    <div className="tutor-body tutor-preview">
      {avatar}
      <h2>{profile.firstName} {profile.lastName}</h2>
      {profile.intro && <p>{profile.intro}</p>}
      {privacy.location && location && <p>{location}</p>}
      {profile.bio && <Bio text={profile.bio} />}
      {privacy.contact && profile.email && <p><a href={'mailto:' + profile.email}>{profile.email}</a></p>}
      {privacy.contact && profile.phone && <p>{profile.phone}</p>}
      <div className="tutor-actions">
        {profile.website && <a href={profile.website} target="_blank" rel="noreferrer">Site</a>}
        {instagram && <a href={'https://www.instagram.com/' + encodeURIComponent(instagram)} target="_blank" rel="noreferrer">Instagram</a>}
        {facebook && <a href={'https://www.facebook.com/' + encodeURIComponent(facebook)} target="_blank" rel="noreferrer">Facebook</a>}
      </div>
      <Link to="/perfil/tutor">Voltar para edição</Link>
    </div>
  );
}

export function TutorPhoto({ photo, save, avatar }) {
  const [error, setError] = useState('');

  async function selectPhoto(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Escolha um arquivo JPG, PNG ou WebP de até 2 MB.');
      return;
    }
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 320;
      const size = Math.min(image.width, image.height);
      canvas.getContext('2d').drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 320, 320);
      image.close();
      save({ photo: canvas.toDataURL('image/webp', 0.85) }, 'Foto atualizada neste navegador.');
    } catch {
      setError('Não foi possível abrir a imagem. Escolha outro arquivo.');
    }
  }

  return (
    <div className="tutor-body tutor-preview">
      {avatar}
      <p>Use uma imagem JPG, PNG ou WebP de até 2 MB.</p>
      <div className="tutor-actions">
        <label htmlFor="tutor-photo" className="btn btn-primary"><FiCamera aria-hidden="true" /> Escolher foto</label>
        <input id="tutor-photo" className="visually-hidden tutor-photo-input" type="file"
          accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} />
        {photo && <button className="btn btn-outline-danger" onClick={() => save({ photo: '' }, 'Foto removida.')}>Remover foto</button>}
      </div>
      {error && <p className="tutor-error" role="alert">{error}</p>}
    </div>
  );
}

export function TutorSecurity() {
  return (
    <form className="tutor-body" onSubmit={(event) => event.preventDefault()}>
      <fieldset disabled>
        <legend>Alterar senha</legend>
        <div className="tutor-field">
          <label htmlFor="tutor-current-password">Senha atual</label>
          <AuthPasswordInput id="tutor-current-password" autoComplete="current-password" />
        </div>
        <div className="tutor-columns">
          <div className="tutor-field">
            <label htmlFor="tutor-new-password">Nova senha</label>
            <AuthPasswordInput id="tutor-new-password" autoComplete="new-password" />
          </div>
          <div className="tutor-field">
            <label htmlFor="tutor-confirm-password">Confirmar nova senha</label>
            <AuthPasswordInput id="tutor-confirm-password" autoComplete="new-password" />
          </div>
        </div>
      </fieldset>
      <p>A alteração de senha ficará disponível após a integração com a autenticação.</p>
    </form>
  );
}

export function TutorPreferences({ options, values, onSave }) {
  const [draft, setDraft] = useState(values);
  return (
    <form className="tutor-body" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      {options.map(([name, label, hint]) => (
        <label className="tutor-setting" key={name}>
          <span><strong>{label}</strong><small>{hint}</small></span>
          <input className="form-check-input" type="checkbox" checked={draft[name]}
            onChange={(event) => setDraft({ ...draft, [name]: event.target.checked })} />
        </label>
      ))}
      <button className="btn btn-primary" type="submit">Salvar preferências</button>
    </form>
  );
}

export function TutorConfirm({ title, confirm, close, action, children }) {
  return (
    <Modal show centered onHide={close} aria-labelledby="tutor-confirm-title">
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title id="tutor-confirm-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={close}>Cancelar</Button>
        <Button variant="danger" onClick={action}>{confirm}</Button>
      </Modal.Footer>
    </Modal>
  );
}
