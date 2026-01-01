import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from './components/Hero';
import TrustBadges from './components/TrustBadges';
import FeaturedListings from './components/FeaturedListings';
import PropertyTypeListings from './components/PropertyTypeListings';
import PopularRegions from './components/PopularRegions';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import AuthModals from '../../components/AuthModals';

export default function HomePage() {
  const { t } = useTranslation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Hero 
        onLoginClick={() => setIsLoginOpen(true)} 
        onRegisterClick={() => setIsRegisterOpen(true)}
      />
      <TrustBadges />
      <FeaturedListings />
      <PropertyTypeListings propertyType="Villa" title={t('property.villas')} />
      <PropertyTypeListings propertyType="Daire" title={t('property.apartments')} />
      <PopularRegions />
      <Testimonials />
      <Footer />
      
      {/* Auth Modals */}
      <AuthModals
        showLogin={isLoginOpen}
        showRegister={isRegisterOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseRegister={() => setIsRegisterOpen(false)}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
        onSwitchToLogin={() => setIsLoginOpen(true)}
      />
    </div>
  );
}
