import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { dbQuery, Property } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AuthModals from '../../components/AuthModals';

interface SeasonalPricing {
  id: string;
  property_id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

interface BookedDate {
  check_in_date: string;
  check_out_date: string;
}

interface PropertyWithDetails extends Property {
  primary_image?: string;
  seasonal_pricing?: SeasonalPricing[];
  booked_dates?: BookedDate[];
  calculated_price_per_night?: number;
  total_price?: number;
  nights?: number;
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
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, appUser, signOut } = useAuth();
  
  // Auth modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // URL'den parametreleri al
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  
  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [propertyLocations, setPropertyLocations] = useState<LocationSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchProperties();
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
        if (prop.city && !seen.has(prop.city)) {
          seen.add(prop.city);
          locations.push({
            text: prop.city,
            type: 'city',
            icon: 'ri-building-2-line',
            subtext: 'Türkiye'
          });
        }
        if (prop.district && !seen.has(`${prop.district}-${prop.city}`)) {
          seen.add(`${prop.district}-${prop.city}`);
          locations.push({
            text: prop.district,
            type: 'district',
            icon: 'ri-map-pin-2-line',
            subtext: prop.city
          });
        }
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
      setSuggestions(POPULAR_LOCATIONS);
      return;
    }

    const searchTerm = location.toLowerCase();
    const allLocations = [...POPULAR_LOCATIONS, ...propertyLocations];
    
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

    setSuggestions(filtered.slice(0, 6));
  }, [location, propertyLocations]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.text);
    setShowSuggestions(false);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      const { data: propertiesData, error } = await dbQuery('properties')
        .select('*')
        .eq('is_available', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;

      // Her ürün için detayları al
      const propertiesWithDetails = await Promise.all(
        (propertiesData || []).map(async (property: any) => {
          const { data: imageData } = await dbQuery('property_images')
            .select('image_url')
            .eq('property_id', property.id)
            .eq('is_primary', true)
            .single()
            .execute();

          const { data: seasonalData } = await dbQuery('seasonal_pricing')
            .select('*')
            .eq('property_id', property.id)
            .execute();

          const { data: bookingsData } = await dbQuery('bookings')
            .select('check_in_date, check_out_date')
            .eq('property_id', property.id)
            .in('status', ['confirmed', 'pending'])
            .execute();

          return {
            ...property,
            primary_image: imageData?.image_url,
            seasonal_pricing: seasonalData || [],
            booked_dates: bookingsData || []
          };
        })
      );

      setProperties(propertiesWithDetails);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gece sayısını hesapla
  const calculateNights = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sezon fiyatlarını hesapla
  const calculatePricing = (property: PropertyWithDetails, start: string, end: string) => {
    if (!start || !end) {
      return {
        pricePerNight: property.price_per_night,
        totalPrice: 0,
        nights: 0
      };
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    let totalPrice = 0;
    let nights = 0;

    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      let priceForDay = property.price_per_night;

      // Bu gün için sezon fiyatı var mı?
      if (property.seasonal_pricing) {
        for (const season of property.seasonal_pricing) {
          const seasonStart = new Date(season.start_date);
          const seasonEnd = new Date(season.end_date);
          
          if (currentDate >= seasonStart && currentDate <= seasonEnd) {
            priceForDay = season.price_per_night;
            break;
          }
        }
      }

      totalPrice += priceForDay;
      nights++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : property.price_per_night,
      totalPrice,
      nights
    };
  };

  // Tarih çakışması kontrolü
  const hasDateConflict = (property: PropertyWithDetails, start: string, end: string): boolean => {
    if (!start || !end || !property.booked_dates?.length) return false;

    const requestStart = new Date(start);
    const requestEnd = new Date(end);

    for (const booking of property.booked_dates) {
      const bookedStart = new Date(booking.check_in_date);
      const bookedEnd = new Date(booking.check_out_date);

      if (requestStart < bookedEnd && requestEnd > bookedStart) {
        return true;
      }
    }

    return false;
  };

  // Filtrelenmiş ürünler
  const filteredProperties = useMemo(() => {
    return properties
      .filter(property => {
        // Konum filtresi
        if (location) {
          const searchTerm = location.toLowerCase();
          const matchesLocation = 
            property.city?.toLowerCase().includes(searchTerm) ||
            property.district?.toLowerCase().includes(searchTerm) ||
            property.location?.toLowerCase().includes(searchTerm) ||
            property.title?.toLowerCase().includes(searchTerm);
          if (!matchesLocation) return false;
        }

        // Misafir sayısı filtresi
        if (guests && property.max_guests < parseInt(guests)) {
          return false;
        }

        // Tarih müsaitlik kontrolü
        if (checkIn && checkOut) {
          if (hasDateConflict(property, checkIn, checkOut)) {
            return false;
          }
        }

        return true;
      })
      .map(property => {
        const pricing = calculatePricing(property, checkIn, checkOut);
        return {
          ...property,
          calculated_price_per_night: pricing.pricePerNight,
          total_price: pricing.totalPrice,
          nights: pricing.nights
        };
      });
  }, [properties, location, checkIn, checkOut, guests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    setSearchParams(params);
  };

  const goToProperty = (propertyId: string) => {
    // Tarihleri URL parametresi olarak gönder
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    
    navigate(`/property/${propertyId}?${params.toString()}`);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const nights = calculateNights(checkIn, checkOut);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="Aylin Villas" className="h-14" />
            </a>
            
            {/* Arama Formu */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-2">
              {/* Konum - Autocomplete */}
              <div className="relative flex items-center gap-2 px-3 border-r border-gray-300">
                <i className="ri-map-pin-line text-[#D4AF37]"></i>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Konum"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                  className="bg-transparent outline-none text-sm w-32"
                />
                {location && (
                  <button 
                    type="button"
                    onClick={() => setLocation('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                )}
                
                {/* Öneriler Dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute top-full left-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {!location.trim() && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Popüler Destinasyonlar
                        </div>
                      )}
                      {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.text}-${index}`}
                            type="button"
                            onClick={() => handleLocationSelect(suggestion)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                              suggestion.type === 'city' ? 'bg-blue-100 text-blue-600' :
                              suggestion.type === 'district' ? 'bg-green-100 text-green-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              <i className={suggestion.icon}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.text}
                              </div>
                              {suggestion.subtext && (
                                <div className="text-xs text-gray-500 truncate">
                                  {suggestion.subtext}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          Sonuç bulunamadı
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 px-3 border-r border-gray-300">
                <i className="ri-calendar-line text-[#D4AF37]"></i>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-transparent outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-r border-gray-300">
                <i className="ri-calendar-check-line text-[#D4AF37]"></i>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-transparent outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2 px-3">
                <i className="ri-user-line text-[#D4AF37]"></i>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="bg-transparent outline-none text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map(num => (
                    <option key={num} value={num}>{num} Misafir</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-10 h-10 bg-[#D4AF37] text-white rounded-full flex items-center justify-center hover:bg-[#B8960D] transition-colors"
              >
                <i className="ri-search-line"></i>
              </button>
            </form>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {user && appUser ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-[#D4AF37] transition-colors"
                  >
                    <div className="w-7 h-7 bg-[#D4AF37] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {appUser.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-gray-900 hidden md:block text-sm">{appUser.first_name}</span>
                    <i className={`ri-arrow-down-s-line text-sm transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <a href="/profile" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm">
                          <i className="ri-calendar-check-line"></i>
                          Rezervasyonlarım
                        </a>
                        <a href="/profile" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm">
                          <i className="ri-user-line"></i>
                          Profilim
                        </a>
                        <hr className="my-1" />
                        <button 
                          onClick={() => { signOut(); setShowUserMenu(false); }}
                          className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left text-sm"
                        >
                          <i className="ri-logout-box-line"></i>
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    Giriş
                  </button>
                  <button 
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-full text-sm font-medium hover:bg-[#B8960D] transition-colors"
                  >
                    Kayıt Ol
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modals */}
      <AuthModals
        showLogin={isLoginOpen}
        showRegister={isRegisterOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseRegister={() => setIsRegisterOpen(false)}
        onSwitchToRegister={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }}
        onSwitchToLogin={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }}
      />

      {/* Sonuç Bilgisi */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {location ? `"${location}" için sonuçlar` : 'Tüm Konaklama Yerleri'}
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredProperties.length} konaklama yeri bulundu
                {checkIn && checkOut && (
                  <span className="text-[#D4AF37] font-medium ml-2">
                    • {nights} gece • Sezon fiyatları uygulandı
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sonuçlar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-search-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sonuç bulunamadı</h3>
            <p className="text-gray-600 mb-6">
              Arama kriterlerinize uygun konaklama yeri bulunamadı.
            </p>
            <a 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-medium hover:bg-[#B8960D] transition-colors"
            >
              <i className="ri-home-line"></i>
              Ana Sayfaya Dön
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProperties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                onClick={() => goToProperty(property.id)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Resim */}
                  <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0">
                    <img 
                      src={property.primary_image || 'https://readdy.ai/api/search-image?query=modern%20property%20exterior&width=800&height=600'} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.is_featured && (
                      <div className="absolute top-4 left-4 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Öne Çıkan
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                      }}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <i className={`${favorites.includes(property.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-xl`}></i>
                    </button>
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <i className="ri-map-pin-line text-[#D4AF37]"></i>
                          {[property.location, property.district, property.city].filter(Boolean).join(', ')}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <i className="ri-user-line"></i>
                            {property.max_guests} misafir
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-hotel-bed-line"></i>
                            {property.bedrooms} yatak odası
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-drop-line"></i>
                            {property.bathrooms} banyo
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <i className="ri-star-fill text-[#FFA500]"></i>
                          <span className="font-semibold">{property.rating}</span>
                          <span className="text-gray-500">({property.review_count} değerlendirme)</span>
                        </div>
                      </div>

                      {/* Fiyat */}
                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-gray-900">
                          ₺{(property.calculated_price_per_night || property.price_per_night).toLocaleString('tr-TR')}
                          <span className="text-sm font-normal text-gray-600">/gece</span>
                        </div>
                        
                        {checkIn && checkOut && property.nights && property.nights > 0 && (
                          <>
                            {property.calculated_price_per_night !== property.price_per_night && (
                              <div className="text-sm text-gray-400 line-through">
                                ₺{property.price_per_night.toLocaleString('tr-TR')}/gece
                              </div>
                            )}
                            <div className="mt-2 p-3 bg-[#FDF8E7] rounded-lg">
                              <div className="text-sm text-gray-600">
                                {property.nights} gece toplam
                              </div>
                              <div className="text-xl font-bold text-[#D4AF37]">
                                ₺{(property.total_price || 0).toLocaleString('tr-TR')}
                              </div>
                              {property.cleaning_fee > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  + ₺{property.cleaning_fee.toLocaleString('tr-TR')} temizlik
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            goToProperty(property.id);
                          }}
                          className="mt-4 w-full px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors"
                        >
                          Detayları Gör
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
