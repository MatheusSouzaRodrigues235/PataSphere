import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FiChevronLeft, FiChevronRight, FiFilter, FiMoreHorizontal, FiPlus, FiSearch } from 'react-icons/fi';
import { currency, formatAmount, formatDate, quantity, searchable, types } from './donationData';
import { requestDonations, saveDonation } from './donationApi';
import DonationModal from './DonationModal';
import '@/styles/_ong-donations.scss';

const categories = { all: 'Todas', money: 'Financeiras', food: 'Ração', medicine: 'Medicamentos' };

export default function Donations({ records, setRecords, dark, connected }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);
  const [dialog, setDialog] = useState(null);
  const [feedback, setFeedback] = useState('');

  const totals = { money: 0, food: 0, medicine: 0 };
  for (const record of records) totals[record.type] += record.amount;

  const term = searchable(query);
  const results = records.filter((record) =>
    (category === 'all' || category === record.type)
    && (!filters.payment || filters.payment === record.payment)
    && (!filters.start || filters.start <= record.date)
    && (!filters.end || filters.end >= record.date)
    && searchable([record.name, record.email, types[record.type], record.description].join(' ')).includes(term),
  );
  const lastPage = Math.max(0, Math.ceil(results.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const first = currentPage * pageSize;
  const close = () => setDialog(null);

  async function save(record) {
    const editing = dialog.record;
    const saved = connected ? (await saveDonation(record, Boolean(editing))).record : record;
    setRecords((current) => editing
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current.filter(({ id }) => id !== saved.id)]);
    if (!editing) {
      setQuery('');
      setCategory('all');
      setFilters({});
      setPage(0);
    }
    setFeedback(editing ? 'Doação atualizada.' : 'Doação cadastrada.');
    close();
  }

  async function remove() {
    if (connected) await requestDonations('/' + dialog.record.id, { method: 'DELETE' });
    setRecords((current) => current.filter(({ id }) => id !== dialog.record.id));
    setPage(currentPage);
    setFeedback('Doação excluída.');
    close();
  }

  return (
    <main className="ong-main ong-donations">
      <div className="ong-title">
        <div>
          <h1>Doações</h1>
          <p>Histórico de doações financeiras e de insumos recebidas pela ONG</p>
        </div>
        <button type="button" className="ong-button ong-primary" onClick={() => setDialog({ type: 'form' })}>
          <FiPlus aria-hidden="true" /> Cadastrar doação
        </button>
      </div>

      <dl className="donation-totals">
        <div><dt>Doações financeiras{!connected && ' (exemplo)'}</dt><dd>{currency.format(totals.money / 100)}</dd></div>
        <div><dt>Ração recebida{!connected && ' (exemplo)'}</dt><dd>{quantity.format(totals.food)} kg</dd></div>
        <div><dt>Medicamentos{!connected && ' (exemplo)'}</dt><dd>{quantity.format(totals.medicine)} {totals.medicine === 1 ? 'item' : 'itens'}</dd></div>
      </dl>

      <div className="ong-controls">
        <label className="ong-search">
          <FiSearch aria-hidden="true" />
          <span className="visually-hidden">Pesquisar doação</span>
          <input type="search" placeholder="Pesquisar doação" value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
        </label>
        <button type="button" className="ong-button" onClick={() => setDialog({ type: 'filters' })}>
          <FiFilter aria-hidden="true" /> {Object.values(filters).some(Boolean) ? 'Filtros ativos' : 'Filtros'}
        </button>
      </div>

      <div className="donation-categories" role="group" aria-label="Tipos de doação">
        {Object.entries(categories).map(([value, label]) => (
          <button key={value} type="button" className="ong-button" aria-pressed={category === value}
            onClick={() => { setCategory(value); setPage(0); }}>{label}</button>
        ))}
      </div>

      <div className="donation-history">
        <div className="donation-table-scroll" tabIndex={0} role="region" aria-label="Histórico de doações">
          <table className="donation-table">
            <thead><tr>
              <th scope="col">Doador</th><th scope="col">Tipo</th><th scope="col">Valor / qtd.</th>
              <th scope="col">Pagamento</th><th scope="col">Data</th><th scope="col">Descrição</th>
              <th scope="col"><span className="visually-hidden">Ações</span></th>
            </tr></thead>
            <tbody>
              {results.slice(first, first + pageSize).map((record) => {
                const { id, name, email, type, payment, date } = record;
                const names = name.split(/\s+/);
                const initials = (names.length > 1 ? names[0][0] + names.at(-1)[0] : names[0].slice(0, 2));
                return (
                  <tr key={id}>
                    <td><div className="donation-donor">
                      <span className="donation-avatar" aria-hidden="true">{initials}</span>
                      <div><strong>{name}</strong><span>{email || '—'}</span></div>
                    </div></td>
                    <td><span className="donation-type" data-type={type}>{types[type]}</span></td>
                    <td><strong>{formatAmount(record)}</strong></td><td>{payment}</td>
                    <td><time dateTime={date}>{formatDate(date)}</time></td>
                    <td><button type="button" className="ong-button donation-details-button"
                      aria-label={`Ver descrição da doação de ${name}`}
                      onClick={() => setDialog({ type: 'details', record })}>Ver descrição</button></td>
                    <td>
                      <Dropdown align="end" drop="start">
                        <Dropdown.Toggle as="button" type="button" className="ong-icon donation-actions"
                          aria-label={`Ações para a doação de ${name}`}>
                          <FiMoreHorizontal aria-hidden="true" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                          <Dropdown.Item as="button" onClick={() => setDialog({ type: 'form', record })}>Editar doação</Dropdown.Item>
                          <Dropdown.Item as="button" onClick={() => setDialog({ type: 'delete', record })}>Excluir doação</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
              {!results.length && <tr><td colSpan={7} className="donation-empty">Nenhuma doação encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="donation-pagination">
          <label>Linhas por página
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}>
              {[4, 8, 16].map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <span aria-live="polite">{results.length ? `${first + 1}–${Math.min(first + pageSize, results.length)} de ${results.length}` : '0 doações'}</span>
          <button type="button" className="ong-button" aria-label="Página anterior" disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}><FiChevronLeft aria-hidden="true" /></button>
          <button type="button" className="ong-button" aria-label="Próxima página" disabled={currentPage === lastPage}
            onClick={() => setPage(currentPage + 1)}><FiChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <span className="visually-hidden" role="status">{feedback}</span>

      {dialog && <DonationModal key={dialog.type} dialog={dialog} dark={dark} connected={connected} filters={filters} onClose={close}
        onSave={save} onDelete={remove} onEdit={() => setDialog({ type: 'form', record: dialog.record })}
        onFilter={(next) => { setFilters(next); setPage(0); close(); }} />}
    </main>
  );
}
