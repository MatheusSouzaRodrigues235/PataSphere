import { useState } from 'react';
import { Link, Navigate, NavLink, useLoaderData, useRevalidator, useLocation, useParams } from 'react-router-dom';
import { FiBell, FiCamera, FiEye, FiLock, FiPlus, FiShield, FiUser, FiX } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { useTutorSession } from '@/app/accountSession';
import { legacyProfileChanges, readLegacyProfile, useProfileSave } from '@/app/profileApi';
import { AccountSecurity, CloseAccount } from '@/pages/tutor/AccountSecurity';
import SiteHeader from '@/components/layout/SiteHeader';
import TutorProfileForm from './TutorProfileForm';
import { TutorConfirm, TutorPhoto, TutorPreferences, TutorPreview } from './TutorSections';
import TutorAnimals from './TutorAnimals';
import { readTutorAlerts, readTutorData, resetTutorData, saveTutorData, tutorExampleAlerts } from './tutorStorage';
import { lostAnimalsPath } from '@/pages/lost-animals/lostAnimalsData';
import '@/styles/_tutor-profile.scss';

const base = '/perfil/tutor';

const initialData = {
  profile: {
    firstName: 'Matheus', lastName: 'Souza Rodrigues', intro: '', bio: '', city: '', state: 'São Paulo',
    email: '', phone: '', website: '', instagram: '', facebook: '',
  },
  photo: '',
  alerts: tutorExampleAlerts,
  notifications: { sightings: true, adoption: true, news: false },
  privacy: { location: true, contact: false },
};

const sections = {
  publico: ['Visualizar perfil público', 'Prévia do perfil público', 'Veja como seu perfil seria exibido.', FiEye],
  perfil: ['Perfil', 'Perfil público', 'Adicione informações sobre você', FiUser],
  foto: ['Foto', 'Foto do perfil', 'Atualize a imagem que aparece no seu perfil.', FiCamera],
  seguranca: ['Segurança da conta', 'Segurança da conta', 'Gerencie a senha da sua conta.', FiLock],
  animais: ['Meus animais', 'Meus animais', 'Animais perdidos e encontrados que você cadastrou', LuPawPrint],
  notificacoes: ['Preferências de notificação', 'Preferências de notificação', 'Escolha os avisos que deseja receber no PataSphere.', FiBell],
  privacidade: ['Privacidade', 'Privacidade', 'Escolha quais informações aparecem na prévia do perfil público.', FiShield],
};

const notificationOptions = [
  ['sightings', 'Avistamentos', 'Avisos sobre animais perdidos que você cadastrou.'],
  ['adoption', 'Adoção', 'Mudanças de status dos animais que você quer acompanhar.'],
  ['news', 'Novidades', 'Comunicados do PataSphere.'],
];

const privacyOptions = [
  ['location', 'Localização', 'Mostrar cidade e estado no perfil público.'],
  ['contact', 'Contato', 'Mostrar e-mail e WhatsApp no perfil público.'],
];

function readData() {
  const defaults = initialData;
  try {
    const stored = readTutorData();
    return {
      ...defaults, ...stored,
      profile: { ...defaults.profile, ...stored.profile },
      notifications: { ...defaults.notifications, ...stored.notifications },
      privacy: { ...defaults.privacy, ...stored.privacy },
    };
  } catch {
    return defaults;
  }
}

function Avatar({ photo, initials }) {
  return (
    <span className="tutor-avatar" aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initials}
    </span>
  );
}

export default function TutorProfile() {
  const account = useTutorSession();
  const { settings, error } = useLoaderData();
  const { revalidate, state } = useRevalidator();
  if (account && !settings) {
    return <><SiteHeader /><main className="tutor-page">
      <p role="alert">{error}</p>
      <button type="button" disabled={state === 'loading'} onClick={revalidate}>Tentar novamente</button>
    </main></>;
  }
  return <SettingsForm key={account?.id ?? 'demo'} tutor={account} initial={account ? settings : readData()} />;
}

function SettingsForm({ tutor, initial }) {
  const { secao = 'perfil' } = useParams();
  const { state } = useLocation();
  const [data, setData] = useState(initial);
  const [restored, setRestored] = useState(null);
  const [alerts, setAlerts] = useState(() => readTutorAlerts(tutor?.id));
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const { save, saving, feedback, setFeedback } = useProfileSave('tutor', secao, setData, tutor ? null : saveLocal);

  if (!Object.hasOwn(sections, secao)) return <Navigate to={base} replace />;

  const { profile, photo } = data;
  const firstSurname = profile.lastName.split(/\s+/)[0];
  const initials = [profile.firstName[0], firstSurname[0]].join('').toLocaleUpperCase('pt-BR');
  const avatar = <Avatar photo={photo} initials={initials} />;
  const imported = tutor ? legacyProfileChanges(secao, readLegacyProfile('tutor', tutor.id), data) : null;

  function reviewLegacy() {
    if (secao === 'foto') {
      save(imported, 'Foto importada.');
      return;
    }
    setRestored({ section: secao, changes: imported });
    setRevision((value) => value + 1);
    setFeedback({ section: secao, message: 'Confira os dados recuperados e clique em Salvar.' });
  }

  const [, title, subtitle] = sections[secao];

  function saveLocal(changes, message) {
    try {
      saveTutorData(changes, tutor?.id);
      if (changes.alerts) setAlerts(changes.alerts);
      else setData({ ...data, ...changes });
      setFeedback({ section: secao, message });
      return true;
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível salvar os dados neste navegador.', error: true });
      return false;
    }
  }

  function reset() {
    try {
      resetTutorData(tutor?.id);
      setData(readData());
      setAlerts(readTutorAlerts());
      setRevision((current) => current + 1);
      setConfirm(false);
      setFeedback({ section: secao, message: 'Os dados locais do perfil foram apagados.' });
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível apagar os dados neste navegador.', error: true });
      setConfirm(false);
    }
  }

  const draft = restored?.section === secao ? { ...data, ...restored.changes } : data;
  const content = {
    perfil: <TutorProfileForm profile={draft.profile} save={save} />,
    publico: <TutorPreview data={data} avatar={avatar} />,
    foto: <TutorPhoto photo={photo} save={save} avatar={avatar} />,
    seguranca: <AccountSecurity account={tutor} />,
    animais: <TutorAnimals alerts={alerts} save={saveLocal} notify={(message) => setFeedback({ section: secao, message })} />,
    notificacoes: <TutorPreferences options={notificationOptions} values={draft.notifications}
      onSave={(notifications) => save({ notifications }, 'Preferências salvas.')} />,
    privacidade: <TutorPreferences options={privacyOptions} values={draft.privacy}
      onSave={(privacy) => save({ privacy }, 'Preferências salvas.')} />,
  };

  return (
    <div className="tutor-page">
      <a className="skip-link" href="#tutor-conteudo">Pular para o conteúdo</a>
      <SiteHeader role="tutor" identity={{ name: [profile.firstName, firstSurname].filter(Boolean).join(' ') || 'Tutor', email: profile.email, photo }} />
      <main className="tutor-layout" id="tutor-conteudo" data-animals={secao === 'animais'}>
        <aside className="tutor-card tutor-sidebar">
          <div className="tutor-identity">
            {avatar}
            <strong>{profile.firstName} {firstSurname}</strong>
            <span className="tutor-role">Tutor</span>
          </div>
          <nav className="tutor-nav" aria-label="Configurações do tutor">
            {Object.entries(sections).map(([id, [label, , , Icon]]) => (
              <NavLink key={id} to={id === 'perfil' ? base : base + '/' + id} end
                onClick={() => { setFeedback(null); setRestored(null); }}>
                <Icon aria-hidden="true" />{label}
              </NavLink>
            ))}
            <button type="button" className="tutor-danger" onClick={() => setConfirm(true)}>
              <FiX aria-hidden="true" />{tutor ? 'Encerrar conta' : 'Apagar dados da demonstração'}
            </button>
          </nav>
        </aside>
        <section className="tutor-card tutor-panel" aria-labelledby="tutor-title">
          <header className="tutor-panel-header" data-animals={secao === 'animais'}>
            <div>
              <h1 id="tutor-title">{title}</h1>
              <p>{subtitle}</p>
            </div>
            {secao === 'animais' && (
              <Link className="btn btn-primary tutor-register-animal" to={lostAnimalsPath + '/cadastro'}
                state={{ returnToTutor: true }}><FiPlus aria-hidden="true" /> Cadastrar animal</Link>
            )}
          </header>
          {secao === 'animais' && state?.registeredAnimal && !feedback && (
            <p className="tutor-animal-notice" role="status">Anúncio de {state.registeredAnimal} publicado no mural.</p>
          )}
          <fieldset className="border-0 p-0 m-0" key={secao + revision} disabled={saving}>
            {imported && (secao !== 'foto' || data.photo !== imported.photo) &&
              <button type="button" className="btn btn-link" onClick={reviewLegacy}>
                {secao === 'foto' ? 'Importar foto deste navegador' : 'Revisar dados deste navegador'}
              </button>}
            {content[secao]}
          </fieldset>
          {feedback?.section === secao && (
            <p className={'tutor-feedback' + (feedback.error ? ' tutor-error' : '')}
              role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>
          )}
        </section>
      </main>
      {confirm && tutor && <CloseAccount role="tutor" close={() => setConfirm(false)} />}
      {confirm && !tutor && (
        <TutorConfirm title="Apagar dados da demonstração" confirm="Apagar dados locais" close={() => setConfirm(false)} action={reset}>
          Nesta versão, essa ação apaga as alterações do perfil, a foto, os animais e as preferências salvos neste navegador.
        </TutorConfirm>
      )}
    </div>
  );
}
