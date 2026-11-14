import { useState } from 'react';
import { useOngSession } from '@/app/accountSession';
import SiteHeader from '@/components/layout/SiteHeader';
import { NavLink, useMatch } from 'react-router-dom';
import { FiBell, FiGrid, FiHeart, FiMoon, FiSearch, FiSun, FiUser } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { useAdoptionAnimals } from '@/pages/adoption/adoptionApi';
import { initialAnimals } from './animals';
import { initialDonations } from './donations/donationData';
import { useDonations } from './donations/donationApi';
import Donations from './donations/Donations';
import AnimalManagement from './management/AnimalManagement';
import LostAnimals from './LostAnimals';
import { initialAlerts } from './lostAnimalData';
import OngOverview from './OngOverview';
import { ongSettingsPath } from '@/pages/ong-settings/ongSettingsStorage';

export default function OngDashboard() {
  const ong = useOngSession();
  const organization = ong?.name ?? 'Amor de Pet';
  const donations = Boolean(useMatch('/dashboard/ong/doacoes'));
  const management = Boolean(useMatch('/dashboard/ong/animais'));
  const lostAnimals = Boolean(useMatch('/dashboard/ong/animais-perdidos'));
  const overview = !donations && !management && !lostAnimals;
  const [alerts, setAlerts] = useState(() => ong ? [] : initialAlerts);
  const [demoAnimals, setDemoAnimals] = useState(initialAnimals);
  const { data, loading, error, reload, updateAnimals } = useAdoptionAnimals(ong ? '/meus' : null);
  const animals = ong ? data?.animals ?? [] : demoAnimals;
  const setAnimals = ong ? updateAnimals : setDemoAnimals;
  const [demoRecords, setDemoRecords] = useState(initialDonations);
  const donationHistory = useDonations(Boolean(ong));
  const records = ong ? donationHistory.records ?? [] : demoRecords;
  const setRecords = ong ? donationHistory.updateRecords : setDemoRecords;
  const [dark, setDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="ong-dashboard-page">
      <SiteHeader role="ong" />
      <div className="ong-dashboard" data-bs-theme={dark ? 'dark' : 'light'}>
        <aside className="ong-sidebar">
          <div className="ong-brand"><span aria-hidden="true">
            {ong?.photo ? <img src={ong.photo} alt="" /> : Array.from(organization)[0]?.toLocaleUpperCase('pt-BR')}
          </span> {organization}</div>
          <nav aria-label="Páginas do dashboard">
            <p>Páginas</p>
            <ul>
              <li><NavLink to="/dashboard/ong" end><FiGrid aria-hidden="true" /> Visão geral</NavLink></li>
              <li><NavLink to="/dashboard/ong/doacoes"><FiHeart aria-hidden="true" /> Doações</NavLink></li>
              <li><NavLink to="/dashboard/ong/animais"><LuPawPrint aria-hidden="true" /> Animais</NavLink></li>
              <li><NavLink to="/dashboard/ong/animais-perdidos"><FiSearch aria-hidden="true" /> Animais perdidos</NavLink></li>
              <li><NavLink to={ongSettingsPath}><FiUser aria-hidden="true" /> Perfil da ONG</NavLink></li>
            </ul>
          </nav>
        </aside>

        <div className="ong-workspace">
          <header className="ong-topbar">
            <div className="ong-breadcrumb">
              Dashboards <span aria-hidden="true">/</span> <strong>{lostAnimals ? 'Animais perdidos' : management ? 'Animais' : donations ? 'Doações' : 'Visão geral'}</strong>
            </div>
            <div className="ong-tools">
              <div className="ong-notifications">
                <button type="button" className="ong-icon" aria-label="Notificações" aria-expanded={showNotifications}
                  onClick={() => setShowNotifications((current) => !current)}>
                  <FiBell aria-hidden="true" />
                </button>
                {showNotifications && <p role="status">Nenhuma notificação.</p>}
              </div>
              {!overview && (
                <button type="button" className="ong-icon" aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  onClick={() => setDark((current) => !current)}>
                  {dark ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
                </button>
              )}
            </div>
          </header>

          {(donations || overview) && donationHistory.loading && <p role="status">Carregando doações…</p>}
          {(donations || overview) && donationHistory.error && (
            <div>
              <p role="alert">{donationHistory.error}</p>
              <button type="button" className="ong-button" onClick={donationHistory.reload}>Tentar novamente</button>
            </div>
          )}
          {!donationHistory.loading && !donationHistory.error && (
            <div hidden={!donations}>
              <Donations records={records} setRecords={setRecords} dark={dark} connected={Boolean(ong)} />
            </div>
          )}
          {(management || overview) && loading && <p role="status">Carregando animais…</p>}
          {(management || overview) && error && (
            <div>
              <p role="alert">{error}</p>
              <button type="button" className="ong-button" onClick={reload}>Tentar novamente</button>
            </div>
          )}
          {management && !loading && !error &&
            <AnimalManagement animals={animals} setAnimals={setAnimals} dark={dark} connected={Boolean(ong)} />}
          {lostAnimals && <LostAnimals alerts={alerts} setAlerts={setAlerts} dark={dark} connected={Boolean(ong)} />}
          {overview && !loading && !error && !donationHistory.loading && !donationHistory.error && <OngOverview demo={!ong} organization={organization} animals={animals} records={records} dark={dark} />}
        </div>
      </div>
    </div>
  );
}
