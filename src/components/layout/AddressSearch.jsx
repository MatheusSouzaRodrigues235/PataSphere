import { FiMapPin } from 'react-icons/fi';

export default function AddressSearch({ label, placeholder, value, onChange }) {
  return (
    <label className="adoption-search mt-2">
      <FiMapPin aria-hidden="true" />
      <input type="search" aria-label={label} placeholder={placeholder} value={value}
        onChange={({ target }) => onChange(target.value)} />
    </label>
  );
}
