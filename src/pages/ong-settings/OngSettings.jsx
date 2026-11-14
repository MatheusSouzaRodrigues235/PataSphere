import { useState } from 'react';
import { Link, Navigate, NavLink, useLoaderData, useRevalidator, useParams } from 'react-router-dom';
import { FiBell, FiCamera, FiEye, FiHeart, FiLock, FiShield, FiUser, FiX } from 'react-icons/fi';
import { useOngSession } from '@/app/accountSession';
import { legacyProfileChanges, readLegacyProfile, useProfileSave } from '@/app/profileApi';
import { AccountSecurity, CloseAccount } from '@/pages/tutor/AccountSecurity';
import SiteHeader from '@/components/layout/SiteHeader';
import { TutorConfirm, TutorPreferences } from '@/pages/tutor/TutorSections';
import OngProfileForm from './OngProfileForm';
import { OngImages, OngReceiving } from './OngSettingsSections';
import { ongPreviewPath, ongSettingsPath, readOngSettings, writeOngSettings } from './ongSettingsStorage';
import '@/styles/_tutor-profile.scss';
import '@/styles/_ong-settings.scss';

const sections = {
  perfil: ['Perfil da ONG', 'Perfil público da ONG', 'Adicione informações para que as pessoas conheçam o seu trabalho', FiUser],
  fotos: ['Logo e fotos', 'Logo e fotos', 'Escolha as imagens que identificam a ONG no perfil público.', FiCamera],
  seguranca: ['Segurança da conta', 'Segurança da conta', 'Gerencie a senha da conta da ONG.', FiLock],
  recebimento: ['Formas de recebimento', 'Formas de recebimento', 'Informe como a ONG recebe doações.', FiHeart],
  notificacoes: ['Preferências de notificação', 'Preferências de notificação', 'Escolha quais avisos a ONG deseja receber.', FiBell],
  privacidade: ['Privacidade', 'Privacidade', 'Escolha quais informações aparecem no perfil público.', FiShield],
};

const notificationOptions = [
  ['adoption', 'Adoção', 'Novos interesses em adoção registrados por tutores.'],
  ['sightings', 'Animais perdidos', 'Novos avistamentos em anúncios da ONG.'],
  ['donations', 'Doações', 'Novos registros no histórico de doações.'],
  ['news', 'Novidades', 'Comunicados do PataSphere.'],
];

const privacyOptions = [
  ['contact', 'Contato', 'Mostrar e-mail e WhatsApp.'],
  ['location', 'Localização', 'Mostrar cidade e estado.'],
];

function Avatar({ images, name }) {
  return (
    <span className="tutor-avatar" aria-hidden="true">
      {images.logo ? <img src={images.logo} alt="" /> : name[0]?.toLocaleUpperCase('pt-BR')}
    </span>
  );
}

export default function OngSettings() {
  const account = useOngSession();
  const { settings, error } = useLoaderData();
  const { revalidate, state } = useRevalidator();
  if (account && !settings) {
    return <><SiteHeader /><main className="tutor-page">
      <p role="alert">{error}</p>
      <button type="button" disabled={state === 'loading'} onClick={revalidate}>Tentar novamente</button>
    </main></>;
  }
  return <SettingsForm key={account?.id ?? 'demo'} ong={account} initial={account ? settings : readOngSettings()} />;
}

function SettingsForm({ ong, initial }) {
  const { secao = 'perfil' } = useParams();
  const [data, setData] = useState(initial);
  const [restored, setRestored] = useState(null);
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const { save, saving, feedback, setFeedback } = useProfileSave('ong', secao, setData, ong ? null : saveLocal);

  if (!Object.hasOwn(sections, secao)) return <Navigate replace to={ongSettingsPath} />;

  const legacy = ong ? readLegacyProfile('ong', ong.id) : {};
  const imported = legacyProfileChanges(secao, legacy, data);
  const legacyImages = secao === 'fotos' ? Object.entries(legacy.images ?? {})
    .filter(([name, image]) => ['logo', 'cover'].includes(name) && image?.startsWith?.('data:image/webp;') && image !== data.images[name]) : [];

  function reviewLegacy(changes) {
    setRestored({ section: secao, changes });
    setRevision((value) => value + 1);
    setFeedback({ section: secao, message: 'Confira os dados recuperados e clique em Salvar para publicá-los.' });
  }

  const [, title, description] = sections[secao];

  function saveLocal(changes, message) {
    const next = { ...data, ...changes, ...(changes.images && { images: { ...data.images, ...changes.images } }) };
    try {
      writeOngSettings(next, ong);
      setData(next);
      setFeedback({ section: secao, message });
      return true;
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível salvar os dados neste navegador.', error: true });
      return false;
    }
  }

  function reset() {
    try {
      writeOngSettings(null, ong);
      setData(readOngSettings());
      setRevision((value) => value + 1);
      setFeedback({ section: secao, message: 'Os dados locais da ONG foram apagados.' });
    } catch {
      setFeedback({ section: secao, message: 'Não foi possível apagar os dados neste navegador.', error: true });
    }
    setConfirm(false);
  }

  const draft = restored?.section === secao ? { ...data, ...restored.changes } : data;
  const content = {
    perfil: <OngProfileForm profile={draft.profile} save={save} />,
    fotos: <OngImages images={data.images} save={save} />,
    seguranca: <AccountSecurity account={ong} />,
    recebimento: <OngReceiving data={draft} save={save} />,
    notificacoes: <TutorPreferences options={notificationOptions} values={draft.notifications}
      onSave={(notifications) => save({ notifications }, 'Preferências salvas.')} />,
    privacidade: <TutorPreferences options={privacyOptions} values={draft.privacy}
      onSave={(privacy) => save({ privacy }, 'Preferências salvas.')} />,
  };

  return (
    <div className="tutor-page ong-settings">
      <a className="skip-link" href="#ong-settings-content">Pular para o conteúdo</a>
      <SiteHeader role="ong" identity={{ name: data.profile.name || 'Amor de Pet', email: data.profile.email, photo: data.images.logo }} />
      <main className="tutor-layout" id="ong-settings-content">
        <aside className="tutor-card tutor-sidebar">
          <div className="tutor-identity">
            <Avatar images={data.images} name={data.profile.name} />
            <strong>{data.profile.name}</strong>
            <span className="tutor-role">ONG</span>
          </div>
          <nav className="tutor-nav" aria-label="Configurações da ONG">
            <Link to={ongPreviewPath}><FiEye aria-hidden="true" />Visualizar perfil público</Link>
            {Object.entries(sections).map(([id, [label, , , Icon]]) => (
              <NavLink key={id} to={id === 'perfil' ? ongSettingsPath : ongSettingsPath + '/' + id} end
                onClick={() => { setFeedback(null); setRestored(null); }}>
                <Icon aria-hidden="true" />{label}
              </NavLink>
            ))}
            <button type="button" className="tutor-danger" onClick={() => setConfirm(true)}>
              <FiX aria-hidden="true" />{ong ? 'Encerrar conta' : 'Apagar dados da demonstração'}
            </button>
          </nav>
        </aside>
        <section className="tutor-card tutor-panel" aria-labelledby="ong-settings-title">
          <header className="tutor-panel-header">
            <h1 id="ong-settings-title">{title}</h1>
            <p>{description}</p>
          </header>
          <fieldset className="border-0 p-0 m-0" key={secao + revision} disabled={saving}>
            {imported && <button type="button" className="btn btn-link" onClick={() => reviewLegacy(imported)}>
              Revisar dados deste navegador
            </button>}
            {legacyImages.map(([name, image]) => <button key={name} type="button" className="btn btn-link"
              onClick={() => save({ images: { [name]: image } }, 'Imagem importada para o perfil público.')}>
              Publicar {name === 'logo' ? 'logo' : 'capa'} deste navegador
            </button>)}
            {content[secao]}
          </fieldset>
          {feedback?.section === secao && (
            <p className={'tutor-feedback' + (feedback.error ? ' tutor-error' : '')}
              role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>
          )}
        </section>
      </main>
      {confirm && ong && <CloseAccount role="ong" close={() => setConfirm(false)} />}
      {confirm && !ong && (
        <TutorConfirm title="Apagar dados da demonstração" confirm="Apagar dados locais" close={() => setConfirm(false)} action={reset}>
          Apagar as informações, imagens e preferências da ONG salvas neste navegador?
        </TutorConfirm>
      )}
    </div>
  );
}
