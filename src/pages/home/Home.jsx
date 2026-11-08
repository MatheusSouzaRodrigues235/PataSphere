import HeroSection from './sections/HeroSection';
import BenefitsSection from './sections/BenefitsSection';
import AboutSection from './sections/AboutSection';
import HowItWorksSection from './sections/HowItWorksSection';
import CtaBand from './sections/CtaBand';

export default function Home() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <AboutSection />
      <HowItWorksSection />
      <CtaBand />
    </>
  );
}