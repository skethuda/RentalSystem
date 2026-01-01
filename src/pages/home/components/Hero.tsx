import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dbQuery } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import LanguageSelector from '../../../components/LanguageSelector';

interface HeroProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

interface LocationSuggestion {
  text: string;
  type: 'city' | 'district' | 'region' | 'property';
  icon: string;
  subtext?: string;
}

// Popüler tatil bölgeleri
const POPULAR_LOCATIONS: LocationSuggestion[] = [
  { text: 'Antalya', type: 'city', icon: 'ri-sun-line', subtext: 'Türkiye' },
  { text: 'Muğla', type: 'city', icon: 'ri-sun-line', subtext: 'Türkiye' },
  { text: 'İzmir', type: 'city', icon: 'ri-sun-line', subtext: 'Türkiye' },
  { text: 'Bodrum', type: 'district', icon: 'ri-anchor-line', subtext: 'Muğla' },
  { text: 'Fethiye', type: 'district', icon: 'ri-ship-line', subtext: 'Muğla' },
  { text: 'Kaş', type: 'district', icon: 'ri-compass-3-line', subtext: 'Antalya' },
  { text: 'Kalkan', type: 'region', icon: 'ri-landscape-line', subtext: 'Antalya' },
  { text: 'Marmaris', type: 'district', icon: 'ri-sailboat-line', subtext: 'Muğla' },
  { text: 'Alaçatı', type: 'region', icon: 'ri-windy-line', subtext: 'İzmir' },
  { text: 'Çeşme', type: 'district', icon: 'ri-sun-line', subtext: 'İzmir' },
  { text: 'Datça', type: 'district', icon: 'ri-plant-line', subtext: 'Muğla' },
  { text: 'Side', type: 'district', icon: 'ri-ancient-gate-line', subtext: 'Antalya' },
  { text: 'Belek', type: 'region', icon: 'ri-golf-ball-line', subtext: 'Antalya' },
  { text: 'Kemer', type: 'district', icon: 'ri-mountain-line', subtext: 'Antalya' },
  { text: 'Dalyan', type: 'region', icon: 'ri-leaf-line', subtext: 'Muğla' },
  { text: 'Ölüdeniz', type: 'region', icon: 'ri-flight-takeoff-line', subtext: 'Muğla' },
  { text: 'Sapanca', type: 'district', icon: 'ri-water-flash-line', subtext: 'Sakarya' },
  { text: 'Uludağ', type: 'region', icon: 'ri-snowy-line', subtext: 'Bursa' },
  { text: 'Kapadokya', type: 'region', icon: 'ri-ball-pen-line', subtext: 'Nevşehir' },
  { text: 'Trabzon', type: 'city', icon: 'ri-cloud-line', subtext: 'Türkiye' },
];

export default function Hero({ onLoginClick, onRegisterClick }: HeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, appUser, signOut } = useAuth();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [propertyLocations, setPropertyLocations] = useState<LocationSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mevcut property konumlarını yükle
  useEffect(() => {
    loadPropertyLocations();
  }, []);

  // Dışarı tıklandığında önerileri kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPropertyLocations = async () => {
    try {
      const { data, error } = await dbQuery('properties')
        .select('city, district, location, title')
        .eq('is_available', true)
        .execute();

      if (error) throw error;

      const locations: LocationSuggestion[] = [];
      const seen = new Set<string>();

      (data || []).forEach((prop: any) => {
        // Şehir ekle
        if (prop.city && !seen.has(prop.city)) {
          seen.add(prop.city);
          locations.push({
            text: prop.city,
            type: 'city',
            icon: 'ri-building-2-line',
            subtext: 'Türkiye'
          });
        }
        // İlçe ekle
        if (prop.district && !seen.has(`${prop.district}-${prop.city}`)) {
          seen.add(`${prop.district}-${prop.city}`);
          locations.push({
            text: prop.district,
            type: 'district',
            icon: 'ri-map-pin-2-line',
            subtext: prop.city
          });
        }
        // Konum ekle
        if (prop.location && !seen.has(`${prop.location}-${prop.district}`)) {
          seen.add(`${prop.location}-${prop.district}`);
          locations.push({
            text: prop.location,
            type: 'region',
            icon: 'ri-home-smile-line',
            subtext: `${prop.district}, ${prop.city}`
          });
        }
      });

      setPropertyLocations(locations);
    } catch (error) {
      console.error('Konumlar yüklenirken hata:', error);
    }
  };

  // Konum değiştiğinde önerileri filtrele
  useEffect(() => {
    if (!location.trim()) {
      // Boşsa popüler lokasyonları göster
      setSuggestions(POPULAR_LOCATIONS.slice(0, 8));
      return;
    }

    const searchTerm = location.toLowerCase();
    const allLocations = [...POPULAR_LOCATIONS, ...propertyLocations];
    
    // Benzersiz sonuçlar
    const seen = new Set<string>();
    const filtered = allLocations.filter(loc => {
      const key = `${loc.text}-${loc.subtext}`;
      if (seen.has(key)) return false;
      
      const matches = 
        loc.text.toLowerCase().includes(searchTerm) ||
        (loc.subtext && loc.subtext.toLowerCase().includes(searchTerm));
      
      if (matches) {
        seen.add(key);
        return true;
      }
      return false;
    });

    // İlk önce tam eşleşmeler, sonra başlayanlar, sonra içerenler
    filtered.sort((a, b) => {
      const aExact = a.text.toLowerCase() === searchTerm;
      const bExact = b.text.toLowerCase() === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.text.toLowerCase().startsWith(searchTerm);
      const bStarts = b.text.toLowerCase().startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.text.localeCompare(b.text, 'tr');
    });

    setSuggestions(filtered.slice(0, 8));
  }, [location, propertyLocations]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.text);
    setShowSuggestions(false);
  };

  const handleLocationFocus = () => {
    setShowSuggestions(true);
  };

  // Minimum tarihler
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // URL parametreleri oluştur
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    
    // Arama sayfasına yönlendir
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen">
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

      {/* Navigation */}
      <nav className={`fixed top-10 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'}`}>
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
                          Rezervasyonlarım
                        </a>
                        <a 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="ri-user-line"></i>
                          Profilim
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
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Giriş yapmamış kullanıcı
                <>
                  <button 
                    onClick={onLoginClick} 
                    className="px-5 py-2 border-2 border-[#2C2C2C] text-[#2C2C2C] rounded-lg font-semibold hover:bg-[#2C2C2C] hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('common.login')}
                  </button>
                  <button 
                    onClick={onRegisterClick} 
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

      {/* Hero Section */}
      <div className="relative pt-36 md:pt-40 min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://readdy.ai/api/search-image?query=Modern%20luxury%20vacation%20rental%20interior%20with%20warm%20ambient%20lighting%2C%20cozy%20living%20room%20with%20large%20windows%20overlooking%20scenic%20mountain%20views%2C%20contemporary%20furniture%2C%20soft%20textures%2C%20inviting%20atmosphere%2C%20professional%20real%20estate%20photography%20style%2C%20golden%20hour%20lighting%2C%20ultra%20realistic%2C%208k%20quality&width=1920&height=1080&seq=hero-bg-001&orientation=landscape" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight">
              {t('home.heroTitle').split('\\n').map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-xl text-gray-100 font-light">
              {t('home.heroSubtitle')}
            </p>
          </div>

          {/* Search Card */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl mx-auto relative z-[60]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Konum - Autocomplete */}
              <div className="relative">
                <div className="flex items-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-[#D4AF37] transition-colors focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                  <i className="ri-map-pin-line text-2xl text-[#D4AF37]"></i>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('home.locationLabel')}</label>
                    <input 
                      ref={inputRef}
                      type="text" 
                      placeholder={t('home.locationPlaceholder')} 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={handleLocationFocus}
                      autoComplete="off"
                      className="w-full text-sm font-medium text-gray-900 outline-none"
                    />
                  </div>
                  {location && (
                    <button 
                      type="button"
                      onClick={() => setLocation('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>

                {/* Öneriler Dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                  >
                    <div className="p-2">
                      {!location.trim() && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t('home.popularDestinations')}
                        </div>
                      )}
                      {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.text}-${index}`}
                            type="button"
                            onClick={() => handleLocationSelect(suggestion)}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              suggestion.type === 'city' ? 'bg-blue-100 text-blue-600' :
                              suggestion.type === 'district' ? 'bg-green-100 text-green-600' :
                              suggestion.type === 'region' ? 'bg-amber-100 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <i className={`${suggestion.icon} text-lg`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900">
                                {suggestion.text}
                              </div>
                              {suggestion.subtext && (
                                <div className="text-xs text-gray-500">
                                  {suggestion.subtext}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {suggestion.type === 'city' ? t('home.city') : 
                               suggestion.type === 'district' ? t('home.district') :
                               suggestion.type === 'region' ? t('home.region') : t('home.accommodation')}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-6 text-center text-gray-500">
                          <i className="ri-search-line text-3xl text-gray-300 mb-2 block"></i>
                          <p className="text-sm">"{location}" {t('home.noResults')}</p>
                          <p className="text-xs text-gray-400 mt-1">{t('home.tryDifferent')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-[#D4AF37] transition-colors">
                <i className="ri-calendar-line text-2xl text-[#D4AF37]"></i>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{t('home.checkIn')}</label>
                  <input 
                    type="date" 
                    value={checkIn}
                    min={today}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      // Çıkış tarihi girişten önce ise sıfırla
                      if (checkOut && e.target.value > checkOut) {
                        setCheckOut('');
                      }
                    }}
                    className="w-full text-sm font-medium text-gray-900 outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-[#D4AF37] transition-colors">
                <i className="ri-calendar-check-line text-2xl text-[#D4AF37]"></i>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{t('home.checkOut')}</label>
                  <input 
                    type="date" 
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-[#D4AF37] transition-colors">
                <i className="ri-user-line text-2xl text-[#D4AF37]"></i>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Misafir</label>
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(num => (
                      <option key={num} value={num}>{num} Misafir</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-[#D4AF37] text-white py-4 rounded-full font-bold text-lg hover:bg-[#B8960D] transition-colors flex items-center justify-center space-x-2 whitespace-nowrap">
              <i className="ri-search-line text-xl"></i>
              <span>{t('home.search')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
