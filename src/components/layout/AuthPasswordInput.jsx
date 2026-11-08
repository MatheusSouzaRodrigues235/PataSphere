import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function AuthPasswordInput({ id, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <input {...inputProps} id={id} className="form-control" type={visible ? 'text' : 'password'} />
      <button
        className="auth-password-toggle"
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-controls={id}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
      </button>
    </div>
  );
}
