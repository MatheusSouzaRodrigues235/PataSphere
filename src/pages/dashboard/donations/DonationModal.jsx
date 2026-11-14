import { useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiAlertTriangle, FiCalendar, FiCamera, FiFile, FiImage, FiX } from 'react-icons/fi';
import { formatAmount, formatDate, medicineUnits, payments, today, types } from './donationData';

const delivery = payments.at(-1);
const attachmentTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function Attachment({ file }) {
  const linkRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    linkRef.current.href = objectUrl;
    if (imageRef.current) imageRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <a ref={linkRef} className="donation-attachment" download={file.name}
      title={file.name} aria-label={`Baixar ${file.name}`}>
      {file.type.startsWith('image/') ? <img ref={imageRef} alt="" /> : <FiFile aria-hidden="true" />}
    </a>
  );
}

function DonationDetails({ record }) {
  return (
    <>
      <dl className="donation-details">
        <div><dt>Doador</dt><dd>{record.name}</dd></div>
        <div><dt>E-mail</dt><dd>{record.email || '—'}</dd></div>
        <div><dt>Tipo</dt><dd>{types[record.type]} · {formatAmount(record)}</dd></div>
        <div><dt>Data</dt><dd>{formatDate(record.date)} · {record.payment}</dd></div>
      </dl>
      <p className="donation-description">{record.description || 'Nenhuma descrição informada.'}</p>
      {record.attachments.length > 0 ? (
        <div className="donation-attachments" role="group" aria-label="Anexos">
          {record.attachments.map(({ id, file, name, type, url }) => file
            ? <Attachment key={id} file={file} />
            : <a key={id} className="donation-attachment" href={url} download={name}
                title={name} aria-label={'Baixar ' + name}>
                {type.startsWith('image/') ? <img src={url} alt="" /> : <FiFile aria-hidden="true" />}
              </a>)}
        </div>
      ) : record.id === '0' && (
        <div className="donation-attachments" role="img" aria-label="Quatro espaços ilustrativos para anexos">
          {[1, 2, 3, 4].map((slot) => <span key={slot} className="donation-attachment"><FiImage aria-hidden="true" /></span>)}
        </div>
      )}
    </>
  );
}

function DonationForm({ record, onSave, connected, busy }) {
  const [type, setType] = useState(record?.type ?? 'money');
  const [attachments, setAttachments] = useState(record?.attachments ?? []);
  const [fileError, setFileError] = useState('');
  const [registrationId] = useState(() => record?.id ?? crypto.randomUUID());

  function addFiles(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (connected && (attachments.length + files.length > 4 || files.some(({ size }) => size > 5 * 1024 * 1024))) {
      setFileError('Envie até quatro anexos de no máximo 5 MB cada.');
      return;
    }
    const accepted = files.filter((file) => attachmentTypes.includes(file.type));
    setAttachments((current) => [...current, ...accepted.map((file) => ({ id: crypto.randomUUID(), file }))]);
    setFileError(accepted.length < files.length ? 'Selecione imagens JPG, PNG, WebP, GIF ou arquivos PDF.' : '');
  }

  function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name').trim();
    const amountInput = form.elements.namedItem('amount');
    const raw = amountInput.value.trim();
    const decimals = type === 'money' ? 2 : 3;
    const decimalPattern = new RegExp(`^\\d+(?:[.,]\\d{1,${decimals}})?$`);
    const brazilianMoney = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/;
    const formattedMoney = type === 'money' && brazilianMoney.test(raw);
    const normalized = (formattedMoney ? raw.replaceAll('.', '') : raw).replace(',', '.');
    const value = Number(normalized);
    const amount = type === 'money' ? Math.round(value * 100) : value;

    if (!name) {
      const nameInput = form.elements.namedItem('name');
      nameInput.value = '';
      nameInput.reportValidity();
      return;
    }
    const valid = type === 'medicine' ? /^\d+$/.test(raw) : decimalPattern.test(raw) || formattedMoney;
    const maxAmount = connected ? { money: 99_999_999_999_999, food: 99_999_999_999.999, medicine: 99_999_999_999 }[type]
      : Number.MAX_SAFE_INTEGER;
    if (!valid || amount <= 0 || !Number.isFinite(amount) || amount > maxAmount) {
      amountInput.setCustomValidity(type === 'medicine' ? 'Informe uma quantidade inteira maior que zero.' : 'Informe um valor válido maior que zero.');
      amountInput.reportValidity();
      return;
    }

    onSave({
      id: registrationId, name, email: data.get('email').trim(),
      type, amount, unit: type === 'food' ? 'kg' : data.get('unit') ?? '',
      payment: type === 'money' ? data.get('payment') : delivery,
      date: record?.date ?? today(), description: data.get('description').trim(), attachments,
    });
  }

  return (
    <form id="donation-form" className="donation-form" onSubmit={submit}>
      <fieldset>
        <legend>Tipo de doação</legend>
        <div className="donation-type-switch">
          {Object.entries(types).map(([value, label]) => (
            <label key={value}>
              <input className="visually-hidden" type="radio" name="type" value={value} checked={type === value}
                onChange={() => setType(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="donation-form-grid">
        <label>Nome do doador
          <input name="name" placeholder="Ex.: Ana Paula Ribeiro" defaultValue={record?.name} maxLength={100} required />
        </label>
        <label>E-mail
          <input name="email" type="email" placeholder="doador@email.com" defaultValue={record?.email} maxLength={254} />
        </label>
        <label key={type}>{ { money: 'Valor (R$)', food: 'Quantidade (kg)', medicine: 'Quantidade' }[type] }
          <input name="amount" inputMode={type === 'medicine' ? 'numeric' : 'decimal'} required
            placeholder={type === 'money' ? '0,00' : '0'} maxLength={24}
            defaultValue={record?.type === type ? String(type === 'money' ? record.amount / 100 : record.amount).replace('.', ',') : ''}
            onChange={(event) => event.target.setCustomValidity('')} />
        </label>
        {type === 'money' && <label>Forma de pagamento
          <select name="payment" defaultValue={record?.type === 'money' ? record.payment : payments[0]}>
            {payments.slice(0, -1).map((payment) => <option key={payment}>{payment}</option>)}
          </select>
        </label>}
        {type === 'medicine' && <label>Unidade
          <select name="unit" defaultValue={record?.unit || medicineUnits[0]}>
            {medicineUnits.map((unit) => <option key={unit}>{unit}</option>)}
          </select>
        </label>}
      </div>
      <label>Descrição
        <textarea name="description" placeholder="Ex.: Doação para despesas veterinárias" defaultValue={record?.description}
          rows={3} maxLength={2000} />
      </label>
      <label className="donation-upload">
        <input className="visually-hidden" type="file" accept={attachmentTypes.join(',')} multiple disabled={busy} onChange={addFiles} />
        <span><FiCamera aria-hidden="true" /></span> Clique para anexar fotos ou comprovante
      </label>
      {fileError && <p role="alert" className="donation-file-error">{fileError}</p>}
      {attachments.length > 0 && <ul className="donation-files">
        {attachments.map(({ id, file, name = file?.name }) => <li key={id}>
          <span>{name}</span>
          <button type="button" className="ong-icon" disabled={busy} aria-label={`Remover ${name}`}
            onClick={() => setAttachments((current) => current.filter((item) => item.id !== id))}><FiX aria-hidden="true" /></button>
        </li>)}
      </ul>}
      <p className="donation-date-note"><FiCalendar aria-hidden="true" />
        {record ? `Doação registrada em ${formatDate(record.date)}.` : 'A data da doação é registrada automaticamente.'}
      </p>
    </form>
  );
}

function DonationFilters({ filters, onFilter }) {
  const [draft, setDraft] = useState(filters);
  const update = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  return (
    <form id="donation-filters" className="donation-form" onReset={() => setDraft({})}
      onSubmit={(event) => { event.preventDefault(); onFilter(draft); }}>
      <label>Pagamento ou entrega
        <select value={draft.payment ?? ''} onChange={update('payment')}>
          <option value="">Todas as opções</option>
          {payments.map((payment) => <option key={payment}>{payment}</option>)}
        </select>
      </label>
      <div className="donation-form-grid">
        <label>Data inicial<input type="date" value={draft.start ?? ''} max={draft.end || undefined} onChange={update('start')} /></label>
        <label>Data final<input type="date" value={draft.end ?? ''} min={draft.start || undefined} onChange={update('end')} /></label>
      </div>
    </form>
  );
}

export default function DonationModal({ dialog, dark, filters, connected, onClose, onSave, onDelete, onEdit, onFilter }) {
  const { type, record } = dialog;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy) onClose(); };

  async function persist(action) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const titles = { details: 'Descrição da doação', form: record ? 'Editar doação' : 'Cadastrar doação', filters: 'Filtros' };
  const subtitle = type === 'details' ? 'Registrada no histórico da ONG'
    : type === 'form' ? (record ? 'Atualize as informações da doação.' : 'Registre uma doação recebida para o controle da ONG.') : '';

  return (
    <Modal show onHide={close} scrollable className={`donation-modal donation-modal--${type}`}
      backdropClassName="donation-backdrop" data-bs-theme={dark ? 'dark' : 'light'} aria-labelledby="donation-modal-title">
      {type === 'delete' ? (
        <Modal.Body>
          <span className="donation-warning"><FiAlertTriangle aria-hidden="true" /></span>
          <Modal.Title as="h2" id="donation-modal-title">Excluir esta doação?</Modal.Title>
          <p>A doação de <strong>{record.name}</strong> ({formatAmount(record)}) será removida do histórico. Esta ação não pode ser desfeita.</p>
          {error && <p role="alert" className="donation-file-error">{error}</p>}
          <div className="donation-confirm">
            <button type="button" className="ong-button" onClick={close} disabled={busy}>Cancelar</button>
            <button type="button" className="ong-button ong-primary donation-danger" onClick={() => persist(onDelete)} disabled={busy}>Sim, excluir</button>
          </div>
        </Modal.Body>
      ) : (
        <>
          <Modal.Header>
            <div>
              <Modal.Title as="h2" id="donation-modal-title">{titles[type]}</Modal.Title>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button type="button" className="ong-icon donation-close" onClick={close} disabled={busy} aria-label="Fechar"><FiX aria-hidden="true" /></button>
          </Modal.Header>
          <Modal.Body>
            {type === 'form' && <DonationForm record={record} onSave={(values) => persist(() => onSave(values))} connected={connected} busy={busy} />}
            {error && <p role="alert" className="donation-file-error">{error}</p>}
            {type === 'details' && <DonationDetails record={record} />}
            {type === 'filters' && <DonationFilters filters={filters} onFilter={onFilter} />}
          </Modal.Body>
          <Modal.Footer>
            {type === 'filters' ? (
              <button type="reset" form="donation-filters" className="ong-button">Limpar filtros</button>
            ) : (
              <button type="button" className="ong-button" onClick={close} disabled={busy}>{type === 'details' ? 'Fechar' : 'Cancelar'}</button>
            )}
            {type === 'form' && <button type="submit" form="donation-form" className="ong-button ong-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar doação'}</button>}
            {type === 'details' && <button type="button" className="ong-button ong-primary" onClick={onEdit}>Editar doação</button>}
            {type === 'filters' && <button type="submit" form="donation-filters" className="ong-button ong-primary">Aplicar filtros</button>}
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
