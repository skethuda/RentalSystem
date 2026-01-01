import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Property, dbQuery } from '../../../lib/supabase';
import BookingModal from './BookingModal';

interface BookingCardProps {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  property: Property;
  initialGuests?: number;
}

interface SeasonalPrice {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

export default function BookingCard({ checkInDate, checkOutDate, property, initialGuests = 2 }: BookingCardProps) {
  const { t } = useTranslation();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [adults, setAdults] = useState(initialGuests);
  const [children, setChildren] = useState(0);
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [priceBreakdown, setPriceBreakdown] = useState<Array<{ date: string; price: number; seasonName: string }>>([]);

  useEffect(() => {
    loadSeasonalPrices();
  }, [property.id]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      calculateSeasonalPrice();
    }
  }, [checkInDate, checkOutDate, seasonalPrices]);

  const loadSeasonalPrices = async () => {
    try {
      const { data, error } = await dbQuery('seasonal_pricing')
        .select('*')
        .eq('property_id', property.id)
        .order('start_date', { ascending: true })
        .execute();

      if (error) throw error;
      
      console.log('Sezonluk fiyatlar yüklendi:', data);
      setSeasonalPrices(data || []);
    } catch (error) {
      console.error('Sezonluk fiyatlar yüklenirken hata:', error);
    }
  };

  // Tarihi YYYY-MM-DD formatına çevir (timezone sorunlarını önlemek için)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateSeasonalPrice = () => {
    if (!checkInDate || !checkOutDate) {
      setCalculatedPrice(0);
      setPriceBreakdown([]);
      return;
    }

    let totalPrice = 0;
    const breakdown: Array<{ date: string; price: number; seasonName: string }> = [];
    
    // Tarihleri normalize et (timezone sorunlarını önlemek için)
    const checkInStr = formatDateToString(checkInDate);
    const checkOutStr = formatDateToString(checkOutDate);
    
    // Her gün için fiyat hesapla (çıkış günü dahil değil)
    const currentDate = new Date(checkInDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(checkOutDate);
    endDate.setHours(0, 0, 0, 0);

    console.log('Fiyat hesaplanıyor:', {
      checkIn: checkInStr,
      checkOut: checkOutStr,
      seasonalPricesCount: seasonalPrices.length,
      seasonalPrices: seasonalPrices.map(s => ({
        name: s.season_name,
        start: s.start_date.split('T')[0],
        end: s.end_date.split('T')[0],
        price: s.price_per_night
      }))
    });

    // Her gece için fiyat hesapla (çıkış günü dahil değil)
    while (currentDate < endDate) {
      const dateStr = formatDateToString(currentDate);
      
      // Bu tarih için uygun sezonu bul
      let matchingSeason = null;
      for (const season of seasonalPrices) {
        const seasonStartStr = season.start_date.split('T')[0];
        const seasonEndStr = season.end_date.split('T')[0];
        
        // Tarih sezon aralığında mı kontrol et
        if (dateStr >= seasonStartStr && dateStr <= seasonEndStr) {
          matchingSeason = season;
          break; // İlk eşleşen sezonu kullan
        }
      }

      // Sezon fiyatı varsa onu kullan, yoksa normal fiyat
      const nightPrice = matchingSeason ? matchingSeason.price_per_night : property.price_per_night;
      const seasonName = matchingSeason ? matchingSeason.season_name : 'Normal Fiyat';

      totalPrice += nightPrice;
      breakdown.push({
        date: dateStr,
        price: nightPrice,
        seasonName: seasonName
      });

      // Bir sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Toplam hesaplanan fiyat:', totalPrice, 'TL');
    console.log('Gece sayısı:', breakdown.length);
    console.log('Fiyat dökümü:', breakdown);

    setCalculatedPrice(totalPrice);
    setPriceBreakdown(breakdown);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();
  
  // Sezon fiyatları hesaplanmışsa onu kullan, yoksa normal fiyattan hesapla
  // calculatedPrice > 0 kontrolü: Eğer sezon fiyatları yüklendiyse ve hesaplandıysa kullan
  const basePrice = (calculatedPrice > 0 && priceBreakdown.length > 0) 
    ? calculatedPrice 
    : (nights > 0 ? property.price_per_night * nights : 0);
  
  const cleaningFee = property.cleaning_fee || 0;
  // Deposit değerini kontrol et - undefined, null veya 0 olabilir
  const deposit = (property.deposit !== undefined && property.deposit !== null && !isNaN(property.deposit)) 
    ? Number(property.deposit) 
    : 0;
  const totalPrice = basePrice + cleaningFee + deposit;
  
  console.log('Fiyat özeti:', {
    nights,
    calculatedPrice,
    basePrice,
    cleaningFee,
    deposit,
    propertyDeposit: property.deposit,
    totalPrice,
    hasSeasonalPricing: seasonalPrices.length > 0,
    property: {
      id: property.id,
      title: property.title,
      cleaning_fee: property.cleaning_fee,
      deposit: property.deposit
    }
  });

  // Sezon bazında gruplandırılmış fiyat özeti
  const getSeasonSummary = () => {
    const summary: { [key: string]: { nights: number; totalPrice: number } } = {};
    
    priceBreakdown.forEach(item => {
      if (!summary[item.seasonName]) {
        summary[item.seasonName] = { nights: 0, totalPrice: 0 };
      }
      summary[item.seasonName].nights += 1;
      summary[item.seasonName].totalPrice += item.price;
    });

    return summary;
  };

  const seasonSummary = getSeasonSummary();
  // Sezon fiyatı var mı kontrol et
  const hasSeasonalPricing = seasonalPrices.length > 0 && Object.keys(seasonSummary).length > 0;

  const handleBooking = () => {
    if (!checkInDate || !checkOutDate) {
      alert('Lütfen giriş ve çıkış tarihlerini seçin');
      return;
    }
    if (adults + children > property.max_guests) {
      alert(`Bu konaklama yeri maksimum ${property.max_guests} misafir kabul ediyor`);
      return;
    }
    setShowBookingModal(true);
  };

  return (
    <>
      <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-lg sticky top-24">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">₺{property.price_per_night.toLocaleString('tr-TR')}</span>
            <span className="text-gray-600 ml-1">{t('home.perNight')}</span>
            {seasonalPrices.length > 0 && (
              <div className="text-xs text-[#B8960D] mt-1">Sezonluk fiyatlandırma aktif</div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <i className="ri-star-fill text-[#FFA500]"></i>
            <span className="font-semibold">{property.rating}</span>
            <span className="text-gray-600 text-sm">({property.review_count})</span>
          </div>
        </div>

        {/* Takvime Yönlendirme Linki */}
        <button
          onClick={() => {
            const calendarElement = document.getElementById('availability-calendar');
            if (calendarElement) {
              calendarElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-[#FDF8E7] hover:bg-[#FAF0C8] text-[#97790B] text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-calendar-check-line"></i>
          {t('booking.selectDates')}
          <i className="ri-arrow-down-line"></i>
        </button>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-3 border-r border-gray-300">
              <label className="text-xs font-semibold text-gray-900 block mb-1">{t('booking.checkIn')}</label>
              <input 
                type="text" 
                value={checkInDate ? checkInDate.toLocaleDateString('tr-TR') : ''} 
                placeholder={t('booking.selectDates')}
                readOnly
                className="text-sm text-gray-700 w-full outline-none bg-transparent cursor-pointer"
              />
            </div>
            <div className="p-3">
              <label className="text-xs font-semibold text-gray-900 block mb-1">{t('booking.checkOut')}</label>
              <input 
                type="text" 
                value={checkOutDate ? checkOutDate.toLocaleDateString('tr-TR') : ''} 
                placeholder={t('booking.selectDates')}
                readOnly
                className="text-sm text-gray-700 w-full outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-3">
            <label className="text-xs font-semibold text-gray-900 block mb-2">{t('booking.guests')}</label>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{t('booking.adultsLabel')}</span>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{adults}</span>
                  <button 
                    onClick={() => setAdults(Math.min(property.max_guests, adults + 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{t('booking.childrenLabel')}</span>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{children}</span>
                  <button 
                    onClick={() => setChildren(Math.min(property.max_guests - adults, children + 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleBooking}
          className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#B8960D] transition-colors mb-4 whitespace-nowrap cursor-pointer"
        >
          {t('booking.makeReservation')}
        </button>

        {nights > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {/* Sezon bazında fiyat detayı - sadece sezon fiyatı varsa göster */}
            {hasSeasonalPricing && (
              <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                {Object.entries(seasonSummary).map(([seasonName, data]) => (
                  <div key={seasonName} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {seasonName} ({data.nights} gece)
                    </span>
                    <span className="text-gray-900">₺{data.totalPrice.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Normal fiyat gösterimi - sezon yoksa */}
            {!hasSeasonalPricing && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">₺{property.price_per_night.toLocaleString('tr-TR')} x {nights} gece</span>
                <span className="text-gray-900">₺{basePrice.toLocaleString('tr-TR')}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{t('booking.cleaningFee')}</span>
              <span className="text-gray-900">₺{cleaningFee.toLocaleString('tr-TR')}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('booking.deposit')}</span>
                <span className="text-gray-900">₺{deposit.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900">{t('booking.total')}</span>
              <span className="font-semibold text-gray-900">₺{totalPrice.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        )}
      </div>

      {showBookingModal && (
        <BookingModal
          property={property}
          checkInDate={checkInDate!}
          checkOutDate={checkOutDate!}
          adults={adults}
          children={children}
          totalAmount={totalPrice}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
}
