import { Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import BenefitsSection from './components/BenefitsSection';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import PricingSection from './components/PricingSection';
import DemoSection from './components/DemoSection';
import Footer from './components/Footer';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Ker Hub | El futuro del cuidado, diseñado para personas</title>
        <meta name="description" content="Gestiona tu clínica o consultorio médico con Ker Hub. Citas, historias clínicas, facturación y más. Prueba gratis por 14 días." />
        <meta name="keywords" content="software médico, gestión clínica, historia clínica electrónica, citas médicas, facturación médica, RIPS" />
        <meta property="og:title" content="Ker Hub | El futuro del cuidado, diseñado para personas" />
        <meta property="og:description" content="La plataforma todo-en-uno para profesionales de la salud. Gestiona citas, pacientes y facturación." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://mantainable-formspark.lovable.app" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ker Hub",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "99000",
              "highPrice": "499000",
              "priceCurrency": "COP"
            },
            "description": "Software médico integral para gestión de clínicas y consultorios",
            "featureList": [
              "Gestión de citas",
              "Historia clínica electrónica",
              "Facturación electrónica",
              "Generación de RIPS",
              "Telemedicina"
            ]
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <BenefitsSection />
          <HowItWorksSection />
          <TestimonialsSection />
          <PricingSection />
          <DemoSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
