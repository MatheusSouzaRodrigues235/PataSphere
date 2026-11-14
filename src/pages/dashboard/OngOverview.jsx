import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { FiPlus } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { initialAnimals, statuses } from './animals';
import { formatAmount, today, types } from './donations/donationData';
import '@/styles/_ong-overview.scss';

const requests = [
  { animalName: 'Marshmallow', applicant: 'Fernanda Alves', home: 'Apartamento', pets: '1 gato' },
  { animalName: 'Gilson', applicant: 'Marcos Pereira', home: 'Casa com quintal' },
].map((request) => ({
  ...request,
  animalId: initialAnimals.find(({ name }) => name === request.animalName)?.id,
}));

const monthlyCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
});
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' });

function AnimalThumbnail({ animal }) {
  return (
    <span className="ong-overview-thumbnail">
      {animal.photo ? <img src={animal.photo} alt="" /> : <LuPawPrint aria-hidden="true" />}
    </span>
  );
}

export default function OngOverview({ demo, organization, animals, records, dark }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const urgent = animals.filter((animal) => animal.urgency === 'Alta');
  const recentDonations = records.toSorted((first, second) => second.date.localeCompare(first.date));
  const month = (recentDonations[0]?.date ?? today()).slice(0, 7);
  const monthName = monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
  const monthlyTotal = records.reduce((total, record) =>
    record.type === 'money' && record.date.startsWith(month) ? total + record.amount : total, 0);
  const recentRequests = (demo ? requests : []).flatMap((request) => {
    const animal = animals.find(({ id }) => id === request.animalId);
    return animal ? [{ ...request, animal }] : [];
  });
  const metrics = [
    ['Animais disponíveis', animals.filter(({ status }) => status === statuses[0].label).length],
    ['Urgência alta', urgent.length],
    ['Em processo de adoção', animals.filter(({ status }) => status === statuses[2].label).length],
    [`Doações em ${monthName}${demo ? ' (exemplo)' : ''}`, monthlyCurrency.format(monthlyTotal / 100)],
  ];

  return (
    <main className="ong-main ong-overview">
      <div className="ong-title">
        <div>
          <h1>Visão geral</h1>
          <p>Resumo da {organization} nesta semana</p>
        </div>
        <Link className="ong-button ong-primary" to="animais?cadastrar=1">
          <FiPlus aria-hidden="true" /> Cadastrar animal
        </Link>
      </div>

      <dl className="ong-overview-metrics">
        {metrics.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

      <div className="ong-overview-columns">
        <section className="ong-overview-panel" aria-labelledby="ong-overview-urgent">
          <header>
            <h2 id="ong-overview-urgent">Animais com urgência alta</h2>
            <Link to="animais?urgencia=alta">Ver todos</Link>
          </header>
          {urgent.length ? (
            <ul>
              {urgent.slice(0, 3).map((animal) => (
                <li key={animal.id}>
                  <AnimalThumbnail animal={animal} />
                  <div className="ong-overview-row-info">
                    <strong>{animal.name}</strong>
                    <small>{[
                      animal.species === 'Gato' && animal.sex === 'Fêmea' ? 'Gata' : animal.species,
                      animal.ageLabel || animal.age,
                      animal.medicalCare && 'Cuidados médicos',
                    ].filter(Boolean).join(' · ')}</small>
                  </div>
                  <span className="ong-overview-urgent">Urgência alta</span>
                </li>
              ))}
            </ul>
          ) : <p className="ong-overview-empty">Nenhum animal com urgência alta.</p>}
        </section>

        <section className="ong-overview-panel" aria-labelledby="ong-overview-donations">
          <header>
            <h2 id="ong-overview-donations">Doações recentes</h2>
            <Link to="doacoes">Ver todas</Link>
          </header>
          {recentDonations.length ? (
            <ul>
              {recentDonations.slice(0, 4).map((record) => {
                const names = record.name.trim().split(/\s+/);
                const initials = names.length > 1 ? names[0][0] + names.at(-1)[0] : names[0].slice(0, 2);
                return (
                  <li key={record.id}>
                    <span className="ong-overview-avatar" data-type={record.type} data-payment={record.payment}
                      aria-hidden="true">{initials}</span>
                    <div className="ong-overview-row-info">
                      <strong>{record.name}</strong>
                      <small>{record.type === 'money' ? `${types.money} · ${record.payment}` : types[record.type]}</small>
                    </div>
                    <strong className="ong-overview-amount">{formatAmount(record)}</strong>
                  </li>
                );
              })}
            </ul>
          ) : <p className="ong-overview-empty">Nenhuma doação cadastrada.</p>}
        </section>
      </div>

      <section className="ong-overview-panel" aria-labelledby="ong-overview-requests">
        <header><h2 id="ong-overview-requests">Solicitações de adoção recentes</h2></header>
        {recentRequests.length ? (
          <ul>
            {recentRequests.map((request) => (
              <li key={request.animalId} className="ong-overview-request">
                <AnimalThumbnail animal={request.animal} />
                <div className="ong-overview-row-info">
                  <strong>{request.animal.name}</strong>
                  <small>{[`Solicitação de ${request.applicant}`, request.home, request.pets].filter(Boolean).join(' · ')}</small>
                </div>
                <button type="button" className="ong-button" onClick={() => setSelectedRequest(request)}
                  aria-label={`Ver solicitação de adoção de ${request.animal.name}`}>Ver solicitação</button>
              </li>
            ))}
          </ul>
        ) : <p className="ong-overview-empty">Nenhuma solicitação recente.</p>}
      </section>

      {selectedRequest && (
        <Modal show centered onHide={() => setSelectedRequest(null)} data-bs-theme={dark ? 'dark' : 'light'}
          aria-labelledby="ong-request-title">
          <Modal.Header closeButton closeLabel="Fechar">
            <Modal.Title id="ong-request-title">Solicitação de adoção</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <dl className="ong-overview-request-details">
              <dt>Animal</dt><dd>{selectedRequest.animal.name}</dd>
              <dt>Solicitante</dt><dd>{selectedRequest.applicant}</dd>
              <dt>Moradia</dt><dd>{selectedRequest.home}</dd>
              {selectedRequest.pets && <><dt>Animais na residência</dt><dd>{selectedRequest.pets}</dd></>}
            </dl>
          </Modal.Body>
        </Modal>
      )}
    </main>
  );
}
