import { useEffect, useState } from 'react';
import { dbQuery, Property, Booking } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface BookingWithDetails extends Booking {
  property?: Property;
  guestName: string;
}

interface SeasonalPrice {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookings: BookingWithDetails[];
  price?: number;
  seasonName?: string;
}

export default function BookingCalendar() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null);
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProperty === 'all') {
      loadAllBookings();
      setSelectedPropertyData(null);
      setSeasonalPrices([]);
    } else {
      const loadData = async () => {
        await loadPropertyData(selectedProperty);
        await loadPropertyBookings(selectedProperty);
      };
      loadData();
    }
  }, [selectedProperty, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Properties yükle
      const propertiesResult = await dbQuery('properties')
        .select('*')
        .order('title', { ascending: true })
        .execute();
      
      if (propertiesResult.error) {
        console.error('Properties yüklenirken hata:', propertiesResult.error);
      } else {
        setProperties(propertiesResult.data || []);
      }

      // Tüm bookings yükle
      await loadAllBookings();
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBookings = async () => {
    try {
      const bookingsResult = await dbQuery('bookings')
        .select('*')
        .order('check_in_date', { ascending: true })
        .execute();

      if (bookingsResult.error && !bookingsResult.data) {
        console.error('Rezervasyonlar yüklenirken hata:', bookingsResult.error);
        return;
      }

      const bookingsData = bookingsResult.data || [];

      // Her booking için property bilgisini al
      const bookingsWithDetails = await Promise.all(
        bookingsData.map(async (booking: Booking) => {
          try {
            const propertyResult = await dbQuery('properties')
              .select('*')
              .eq('id', booking.property_id)
              .single()
              .execute();
            
            return {
              ...booking,
              property: propertyResult.error ? null : propertyResult.data,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          } catch (error) {
            console.error('Property yüklenirken hata:', error);
            return {
              ...booking,
              property: null,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          }
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    }
  };

  const loadPropertyData = async (propertyId: string) => {
    try {
      // Property bilgisini al
      const propertyResult = await dbQuery('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
        .execute();

      if (propertyResult.error) {
        console.error('Property yüklenirken hata:', propertyResult.error);
        setSelectedPropertyData(null);
      } else {
        setSelectedPropertyData(propertyResult.data);
      }

      // Sezon fiyatlarını yükle
      const seasonalResult = await dbQuery('seasonal_pricing')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true })
        .execute();

      if (seasonalResult.error) {
        console.error('Sezon fiyatları yüklenirken hata:', seasonalResult.error);
        setSeasonalPrices([]);
      } else {
        setSeasonalPrices(seasonalResult.data || []);
      }
    } catch (error) {
      console.error('Property verileri yüklenirken hata:', error);
    }
  };

  const loadPropertyBookings = async (propertyId: string) => {
    try {
      const bookingsResult = await dbQuery('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('check_in_date', { ascending: true })
        .execute();

      if (bookingsResult.error && !bookingsResult.data) {
        console.error('Rezervasyonlar yüklenirken hata:', bookingsResult.error);
        return;
      }

      const bookingsData = bookingsResult.data || [];

      // Property bilgisini al (her zaman güncel olması için)
      const propertyResult = await dbQuery('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
        .execute();

      const property = propertyResult.error ? null : propertyResult.data;

      const bookingsWithDetails = bookingsData.map((booking: Booking) => ({
        ...booking,
        property: property,
        guestName: `${booking.first_name} ${booking.last_name}`
      }));

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    }
  };

  // Takvim günlerini oluştur
  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Ayın ilk günü
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // İlk günün haftanın hangi günü olduğu (0 = Pazar, 1 = Pazartesi, ...)
    const startDay = firstDay.getDay();
    // Pazartesi başlangıç için ayarla (0 = Pazar -> 6, 1 = Pazartesi -> 0)
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
    
    const days: CalendarDay[] = [];
    
    // Önceki ayın son günleri
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const priceInfo = getPriceForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        bookings: getBookingsForDate(date),
        price: priceInfo.price,
        seasonName: priceInfo.seasonName
      });
    }
    
    // Mevcut ayın günleri
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const priceInfo = getPriceForDate(date);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        bookings: getBookingsForDate(date),
        price: priceInfo.price,
        seasonName: priceInfo.seasonName
      });
    }
    
    // Sonraki ayın ilk günleri (takvimi tamamlamak için)
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const priceInfo = getPriceForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        bookings: getBookingsForDate(date),
        price: priceInfo.price,
        seasonName: priceInfo.seasonName
      });
    }
    
    return days;
  };

  // Tarihi YYYY-MM-DD formatına çevir
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Belirli bir tarih için fiyat hesapla
  const getPriceForDate = (date: Date): { price: number; seasonName?: string } => {
    if (!selectedPropertyData || selectedProperty === 'all' || !selectedPropertyData.price_per_night) {
      return { price: 0 };
    }

    const dateStr = formatDateToString(date);
    
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
    const price = matchingSeason ? matchingSeason.price_per_night : (selectedPropertyData.price_per_night || 0);
    const seasonName = matchingSeason ? matchingSeason.season_name : undefined;

    return { price, seasonName };
  };

  // Belirli bir tarih için rezervasyonları getir
  const getBookingsForDate = (date: Date): BookingWithDetails[] => {
    const dateStr = formatDateToString(date);
    
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in_date).toISOString().split('T')[0];
      const checkOut = new Date(booking.check_out_date).toISOString().split('T')[0];
      
      // Tarih check-in ve check-out arasında mı? (check-out hariç)
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rezervasyon Takvimi</h1>
            <p className="text-gray-600 mt-1">Ürünlerin rezervasyon durumunu takvim görünümünde görüntüleyin</p>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Villa Seç</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                <option value="all">Tüm Villalar</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Bugün
              </button>
            </div>
          </div>
        </div>

        {/* Takvim */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Takvim Header */}
          <div className="bg-[#D4AF37] text-white p-4 flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-[#B8960D] rounded-lg transition-colors"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-[#B8960D] rounded-lg transition-colors"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>

          {/* Takvim Grid */}
          <div className="p-4">
            {/* Hafta Günleri Başlıkları */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Takvim Günleri */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const hasBookings = day.bookings.length > 0;
                const isPast = day.date < new Date() && !day.isToday;
                const showPrice = selectedProperty !== 'all' && day.price && day.price > 0;
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] border-2 rounded-lg p-2 transition-all cursor-pointer flex flex-col
                      ${day.isCurrentMonth ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}
                      ${day.isToday ? 'border-[#D4AF37] bg-[#FDF8E7]' : ''}
                      ${hasBookings ? 'hover:border-[#D4AF37] hover:shadow-md' : ''}
                      ${isPast ? 'opacity-60' : ''}
                    `}
                    onClick={() => {
                      if (hasBookings) {
                        setSelectedBooking(day.bookings[0]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className={`text-sm font-medium ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      {showPrice && (
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#D4AF37]">
                            ₺{day.price.toLocaleString('tr-TR')}
                          </div>
                          {day.seasonName && (
                            <div className="text-[10px] text-gray-500 truncate max-w-[60px]" title={day.seasonName}>
                              {day.seasonName}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Rezervasyonlar */}
                    <div className="space-y-1 mt-auto">
                      {day.bookings.slice(0, 2).map((booking, idx) => (
                        <div
                          key={booking.id || idx}
                          className={`
                            text-xs px-2 py-1 rounded text-white truncate
                            ${getStatusColor(booking.status)}
                          `}
                          title={`${booking.guestName} - ${booking.property?.title || 'Bilinmeyen'}`}
                        >
                          {booking.property?.title || 'Villa'}
                        </div>
                      ))}
                      {day.bookings.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{day.bookings.length - 2} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rezervasyon Detay Modal */}
        {selectedBooking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Rezervasyon Detayları</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Villa</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.property?.title || 'Bilinmeyen Villa'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Misafir</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.guestName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedBooking.email}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Giriş Tarihi</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedBooking.check_in_date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Çıkış Tarihi</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedBooking.check_out_date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Yetişkin</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedBooking.adults}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Çocuk</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedBooking.children}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Toplam Tutar</label>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    ₺{selectedBooking.total_amount.toLocaleString('tr-TR')}
                  </p>
                </div>

                {selectedBooking.special_requests && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Özel İstekler</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}

                {selectedBooking.status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Durum</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedBooking.status === 'confirmed' ? 'Onaylandı' :
                         selectedBooking.status === 'cancelled' ? 'İptal Edildi' :
                         selectedBooking.status === 'completed' ? 'Tamamlandı' :
                         'Beklemede'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

