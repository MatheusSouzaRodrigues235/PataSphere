import { useEffect, useRef, useState } from 'react';
import { FiCamera } from 'react-icons/fi';

export default function OngLogoField() {
  const inputRef = useRef(null);
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const previewUrl = logo?.url;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function clearLogo(message = '') {
    inputRef.current.value = '';
    setLogo(null);
    setError(message);
  }

  function handleChange(event) {
    const file = event.currentTarget.files[0];
    if (!file) {
      clearLogo();
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      clearLogo('Selecione uma imagem JPG ou PNG.');
      return;
    }

    setError('');
    setLogo({ name: file.name, url: URL.createObjectURL(file) });
  }

  return (
    <div className="ong-logo-field">
      <span id="ong-logo-label" className="ong-logo-label">Logo (opcional)</span>
      <input
        ref={inputRef}
        className="visually-hidden"
        id="ong-logo"
        name="logo"
        type="file"
        accept="image/jpeg,image/png"
        aria-labelledby="ong-logo-label"
        aria-describedby="ong-logo-help"
        onChange={handleChange}
      />
      <label htmlFor="ong-logo" className="ong-logo-picker">
        <span className="ong-logo-thumbnail">
          {logo ? (
            <img
              key={logo.url}
              src={logo.url}
              alt=""
              onError={() => clearLogo('A imagem não pôde ser aberta. Selecione outro JPG ou PNG.')}
            />
          ) : <FiCamera aria-hidden="true" />}
        </span>
        <span id="ong-logo-help">
          {logo ? <>Trocar o logo (JPG ou PNG)<br /><strong>{logo.name}</strong></> : 'Clique para selecionar o logo (JPG ou PNG)'}
        </span>
      </label>
      {logo && (
        <button
          type="button"
          className="auth-action ong-logo-remove"
          onClick={() => {
            clearLogo();
            inputRef.current.focus();
          }}
        >
          Remover logo
        </button>
      )}
      <p className="ong-logo-error" role="status">{error}</p>
    </div>
  );
}
