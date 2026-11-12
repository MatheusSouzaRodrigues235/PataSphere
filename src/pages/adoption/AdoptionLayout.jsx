import { Outlet } from 'react-router-dom';
import { AdoptionFooter, AdoptionHeader } from './AdoptionNavigation';

export default function AdoptionLayout() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AdoptionHeader />
      <main id="conteudo"><Outlet /></main>
      <AdoptionFooter />
    </>
  );
}
