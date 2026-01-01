import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import AuthModals from './AuthModals';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  isScrolled?: boolean;
  variant?: 'transparent' | 'solid';
}

export default function Header({ isScrolled = false, variant = 'solid' }: HeaderProps) {
  const { t } = useTranslation();
  const { user, appUser, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const bgClass = variant === 'transparent' && !isScrolled
    ? 'bg-white/90 backdrop-blur-sm'
    : 'bg-white shadow-md';

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#2C2C2C] text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10">
            {/* Sol: İletişim Bilgileri */}
            <div className="hidden md:flex items-center gap-6">
              <a href="mailto:info@aylinvillas.com" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                <i className="ri-mail-line"></i>
                <span>info@aylinvillas.com</span>
              </a>
              <a href="tel:+905551234567" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                <i className="ri-phone-line"></i>
                <span>+90 555 123 45 67</span>
              </a>
            </div>
            <div className="md:hidden flex items-center gap-4">
              <a href="mailto:info@aylinvillas.com" className="hover:text-[#D4AF37] transition-colors">
                <i className="ri-mail-line text-lg"></i>
              </a>
              <a href="tel:+905551234567" className="hover:text-[#D4AF37] transition-colors">
                <i className="ri-phone-line text-lg"></i>
              </a>
            </div>

            {/* Sağ: Dil Seçici ve Sosyal Medya */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <div className="h-4 w-px bg-gray-600"></div>
              <a 
                href="https://instagram.com/aylinvillas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] transition-colors"
                aria-label="Instagram"
              >
                <i className="ri-instagram-line text-lg"></i>
              </a>
              <a 
                href="https://facebook.com/aylinvillas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] transition-colors"
                aria-label="Facebook"
              >
                <i className="ri-facebook-line text-lg"></i>
              </a>
              <a 
                href="https://wa.me/905551234567" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] transition-colors"
                aria-label="WhatsApp"
              >
                <i className="ri-whatsapp-line text-lg"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <nav className={`fixed top-10 left-0 right-0 z-40 transition-all duration-300 ${bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-28">
            {/* Logo */}
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="Aylin Villas" className="h-20 md:h-24 object-contain drop-shadow-sm" />
            </a>

            {/* Menü */}
            <div className="hidden md:flex items-center gap-1">
              <a 
                href="/search" 
                className="px-4 py-2 text-gray-800 hover:text-[#D4AF37] font-semibold text-sm tracking-wide transition-colors"
              >
                {t('menu.rentals')}
              </a>
              <a 
                href="#contact" 
                className="px-4 py-2 text-gray-800 hover:text-[#D4AF37] font-semibold text-sm tracking-wide transition-colors"
              >
                {t('menu.contact')}
              </a>
              <a 
                href="/supplier-application" 
                className="px-4 py-2 text-gray-800 hover:text-[#D4AF37] font-semibold text-sm tracking-wide transition-colors"
              >
                {t('menu.rentYourProperty')}
              </a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              {user && appUser ? (
                // Giriş yapmış kullanıcı
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-[#D4AF37] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center text-white font-semibold">
                      {appUser.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-gray-900 hidden sm:block">{appUser.first_name}</span>
                    <i className={`ri-arrow-down-s-line transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">{appUser.first_name} {appUser.last_name}</p>
                          <p className="text-sm text-gray-500">{appUser.email}</p>
                        </div>
                        <a 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="ri-calendar-check-line"></i>
                          {t('common.reservations')}
                        </a>
                        <a 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="ri-user-line"></i>
                          {t('common.profile')}
                        </a>
                        <hr className="my-2 border-gray-100" />
                        <button 
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <i className="ri-logout-box-line"></i>
                          {t('common.logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Giriş yapmamış kullanıcı
                <>
                  <button 
                    onClick={() => setIsLoginOpen(true)} 
                    className="px-5 py-2 border-2 border-[#2C2C2C] text-[#2C2C2C] rounded-lg font-semibold hover:bg-[#2C2C2C] hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('common.login')}
                  </button>
                  <button 
                    onClick={() => setIsRegisterOpen(true)} 
                    className="px-5 py-2 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors whitespace-nowrap"
                  >
                    {t('common.register')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modals */}
      <AuthModals
        showLogin={isLoginOpen}
        showRegister={isRegisterOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseRegister={() => setIsRegisterOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
}



