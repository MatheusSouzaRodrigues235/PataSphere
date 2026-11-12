import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { animalFields, todayDate } from './lostAnimalsData';

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function LostAnimalForm({ onClose, onAdd }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const photos = data.getAll('photos');
    data.delete('photos');
    const fields = Object.fromEntries(data);
    const values = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()]));

    if (!values.name || !values.neighborhood || !values.city || !values.description || !values.contactName) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (!/^\+?[\d ()-]+$/.test(values.phone) || !/^\d{10,15}$/.test(values.phone.replace(/\D/g, ''))) {
      setError('Informe um telefone com DDD.');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (photos.length > 4 || photos.some((photo) => !photo.size || photo.size > 5 * 1024 * 1024 || !allowedTypes.includes(photo.type))) {
      setError('Escolha de 1 a 4 fotos JPG, PNG ou WebP de até 5 MB cada.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const images = await Promise.all(photos.map(readPhoto));
      onAdd({ ...values, id: crypto.randomUUID(), photo: images[0], photos: images });
    } catch {
      setError('Não foi possível adicionar o alerta. Tente selecionar a foto novamente.');
      setSaving(false);
    }
  }

  return (
    <Modal show centered scrollable onHide={saving ? undefined : onClose} className="adoption-modal lost-modal" aria-labelledby="lost-add-title">
      <Modal.Header closeButton={!saving} closeLabel="Fechar">
        <Modal.Title as="h2" id="lost-add-title">Adicionar um animal perdido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>O alerta ficará disponível nesta visita.</p>
        <form id="lost-add-form" className="lost-form" onSubmit={submit}>
          <label>Nome do animal<input name="name" className="form-control" required maxLength={60} /></label>
          {animalFields.map(([name, label, options]) => (
            <label key={name}>{label}<select name={name} className="form-select" required defaultValue="">
              <option value="" disabled>Selecione</option>
              {options.map((option) => <option key={option}>{option}</option>)}
            </select></label>
          ))}
          <label>Idade (opcional)<input name="ageLabel" className="form-control" maxLength={30} /></label>
          <label>Data do desaparecimento<input type="date" name="date" className="form-control" required max={todayDate} /></label>
          <label>Bairro<input name="neighborhood" className="form-control" required maxLength={80} /></label>
          <label>Cidade<input name="city" className="form-control" required maxLength={80} /></label>
          <label className="lost-form-wide">Descrição<textarea name="description" className="form-control" rows={3} required maxLength={500} /></label>
          <label className="lost-form-wide">Fotos do animal (até 4)<input type="file" name="photos" multiple className="form-control" accept="image/jpeg,image/png,image/webp" required /></label>
          <label>Nome para contato<input name="contactName" className="form-control" required maxLength={80} /></label>
          <label>Telefone para contato<input type="tel" name="phone" className="form-control" required inputMode="tel" maxLength={20} /></label>
          <label>E-mail para contato (opcional)<input type="email" name="email" className="form-control" maxLength={120} /></label>
          {error && <p className="lost-form-wide text-danger mb-0" role="alert">{error}</p>}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="adoption-control" disabled={saving} onClick={onClose}>Cancelar</button>
        <button type="submit" form="lost-add-form" className="adoption-action" disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar alerta'}</button>
      </Modal.Footer>
    </Modal>
  );
}
