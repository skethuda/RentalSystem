import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dbQuery } from '../../../lib/supabase';

interface AvailabilityCalendarProps {
  onDateSelect: (checkIn: Date | null, checkOut: Date | null) => void;
  propertyId: string;
  minimumNights: number;
}

interface BookedDate {
  check_in_date: string;
  check_out_date: string;
  status: string;
  first_name?: string;
  last_name?: string;
}

export default function AvailabilityCalendar({ onDateSelect, propertyId, minimumNights }: AvailabilityCalendarProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchBookedDates();
  }, [propertyId]);

  const fetchBookedDates = async () => {
    try {
      // Önce tüm rezervasyonları çekelim (status filtresi olmadan)
      const { data, error } = await dbQuery('bookings')
        .select('check_in_date, check_out_date, status, first_name, last_name')
        .eq('property_id', propertyId)
        .execute();

      if (error) {
        console.error('Supabase sorgu hatası:', error);
        throw error;
      }
      
      console.log('Property ID:', propertyId);
      console.log('Tüm rezervasyonlar:', data);
      
      // İptal edilmemiş rezervasyonları filtrele
      const activeBookings = (data || []).filter(
        (booking: BookedDate) => booking.status !== 'cancelled' && booking.status !== 'completed'
      );

      // Satışa kapalı tarihleri de yükle (blocked_dates)
      const { data: blockedData, error: blockedError } = await dbQuery('blocked_dates')
        .select('start_date, end_date, reason')
        .eq('property_id', propertyId)
        .execute();

      if (blockedError) {
        console.error('blocked_dates sorgu hatası:', blockedError);
      }

      const blockedAsBookings: BookedDate[] = (blockedData || []).map((block: any) => ({
        check_in_date: block.start_date,
        check_out_date: block.end_date,
        status: 'blocked',
      }));
      
      console.log('Aktif rezervasyonlar:', activeBookings);
      console.log('Satışa kapalı tarih aralıkları:', blockedAsBookings);
      
      // Hem gerçek rezervasyonları hem de blokajları tek listede tut
      setBookedDates([...activeBookings, ...blockedAsBookings]);
    } catch (error) {
      console.error('Rezervasyon tarihleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingForDate = (date: Date): BookedDate | null => {
    // Tarihi YYYY-MM-DD formatına çevir (timezone sorunlarını önlemek için)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return bookedDates.find(booking => {
      const checkInStr = booking.check_in_date.split('T')[0];
      const checkOutStr = booking.check_out_date.split('T')[0];
      
      // String karşılaştırması yap (YYYY-MM-DD formatı lexicographic olarak sıralanabilir)
      return dateStr >= checkInStr && dateStr < checkOutStr;
    }) || null;
  };

  const isDateBooked = (date: Date): boolean => {
    return getBookingForDate(date) !== null;
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isCheckInDate = (date: Date): boolean => {
    const dateStr = formatDateToString(date);
    
    return bookedDates.some(booking => {
      const checkInStr = booking.check_in_date.split('T')[0];
      return dateStr === checkInStr;
    });
  };

  const isCheckOutDate = (date: Date): boolean => {
    const dateStr = formatDateToString(date);
    
    return bookedDates.some(booking => {
      const checkOutStr = booking.check_out_date.split('T')[0];
      return dateStr === checkOutStr;
    });
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Geçmiş tarih veya dolu tarih kontrolü
    if (isDateInPast(clickedDate) || isDateBooked(clickedDate)) {
      return;
    }
    
    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      setSelectedCheckIn(clickedDate);
      setSelectedCheckOut(null);
      onDateSelect(clickedDate, null);
    } else if (selectedCheckIn && !selectedCheckOut) {
      if (clickedDate > selectedCheckIn) {
        // Gece sayısını hesapla
        const nightCount = Math.ceil((clickedDate.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24));
        
        // Minimum konaklama süresi kontrolü
        if (nightCount < minimumNights) {
          alert(`Bu konaklama yeri için minimum ${minimumNights} gece konaklama gereklidir.`);
          return;
        }
        
        // Seçilen aralıkta dolu tarih var mı kontrol et
        const hasBookedDateInRange = checkDateRangeAvailability(selectedCheckIn, clickedDate);
        
        if (hasBookedDateInRange) {
          alert('Seçtiğiniz tarih aralığında dolu günler var. Lütfen farklı tarihler seçin.');
          return;
        }
        
        setSelectedCheckOut(clickedDate);
        onDateSelect(selectedCheckIn, clickedDate);
      } else {
        setSelectedCheckIn(clickedDate);
        setSelectedCheckOut(null);
        onDateSelect(clickedDate, null);
      }
    }
  };

  const checkDateRangeAvailability = (startDate: Date, endDate: Date): boolean => {
    const current = new Date(startDate);
    current.setDate(current.getDate() + 1); // Giriş gününü dahil etme
    
    while (current < endDate) {
      if (isDateBooked(current)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return false;
  };

  const isDateInRange = (day: number) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > selectedCheckIn && date < selectedCheckOut;
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (selectedCheckIn && date.getTime() === selectedCheckIn.getTime()) ||
           (selectedCheckOut && date.getTime() === selectedCheckOut.getTime());
  };

  const isSelectedCheckIn = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selectedCheckIn && date.getTime() === selectedCheckIn.getTime();
  };

  const isSelectedCheckOut = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selectedCheckOut && date.getTime() === selectedCheckOut.getTime();
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const clearSelection = () => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    onDateSelect(null, null);
  };

  // Ay ve gün isimleri - i18n ile dinamik olarak alınacak
  const monthNames = [
    t('calendar.january', { defaultValue: 'Ocak' }),
    t('calendar.february', { defaultValue: 'Şubat' }),
    t('calendar.march', { defaultValue: 'Mart' }),
    t('calendar.april', { defaultValue: 'Nisan' }),
    t('calendar.may', { defaultValue: 'Mayıs' }),
    t('calendar.june', { defaultValue: 'Haziran' }),
    t('calendar.july', { defaultValue: 'Temmuz' }),
    t('calendar.august', { defaultValue: 'Ağustos' }),
    t('calendar.september', { defaultValue: 'Eylül' }),
    t('calendar.october', { defaultValue: 'Ekim' }),
    t('calendar.november', { defaultValue: 'Kasım' }),
    t('calendar.december', { defaultValue: 'Aralık' })
  ];
  const dayNames = [
    t('calendar.sunday', { defaultValue: 'Paz' }),
    t('calendar.monday', { defaultValue: 'Pzt' }),
    t('calendar.tuesday', { defaultValue: 'Sal' }),
    t('calendar.wednesday', { defaultValue: 'Çar' }),
    t('calendar.thursday', { defaultValue: 'Per' }),
    t('calendar.friday', { defaultValue: 'Cum' }),
    t('calendar.saturday', { defaultValue: 'Cmt' })
  ];

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getTooltipContent = (date: Date): string | null => {
    const booking = getBookingForDate(date);
    if (booking) {
      const checkInStr = booking.check_in_date.split('T')[0];
      const checkOutStr = booking.check_out_date.split('T')[0];
      // Eğer satışa kapalı kayıt ise farklı tooltip göster
      if (booking.status === 'blocked') {
        return `⛔ Satışa kapalı\n${formatTooltipDate(checkInStr)} - ${formatTooltipDate(checkOutStr)}`;
      }
      const statusText = booking.status === 'confirmed' ? t('propertyDetail.confirmed') : t('propertyDetail.pending');
      return `🔒 ${t('propertyDetail.booked')}\n${formatTooltipDate(checkInStr)} - ${formatTooltipDate(checkOutStr)}\n${t('propertyDetail.confirmed')}: ${statusText}`;
    }
    
    if (isCheckOutDate(date) && !isDateBooked(date)) {
      return `✓ ${t('propertyDetail.checkoutAvailable')}`;
    }
    
    if (isDateInPast(date)) {
      return `❌ ${t('propertyDetail.pastDate')}`;
    }
    
    return null;
  };

  if (loading) {
return (
    <div id="availability-calendar" className="border-b border-gray-200 pb-8 scroll-mt-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('propertyDetail.availabilityCalendar')}</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">{t('propertyDetail.calendarLoading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Toplam dolu gün sayısını hesapla
  const totalBookedDays = bookedDates.reduce((acc, booking) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return acc + days;
  }, 0);

  return (
    <div id="availability-calendar" className="border-b border-gray-200 pb-8 scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('propertyDetail.availabilityCalendar')}</h2>
          {bookedDates.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-red-500 font-medium">{bookedDates.length}</span> {t('propertyDetail.activeReservations')}, 
              <span className="text-red-500 font-medium"> {totalBookedDays}</span> {t('propertyDetail.bookedDays')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {minimumNights > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#FDF8E7] text-[#97790B] rounded-lg">
              <i className="ri-information-line"></i>
              <span className="text-sm font-medium">{t('propertyDetail.minNights', { nights: minimumNights })}</span>
            </div>
          )}
          {(selectedCheckIn || selectedCheckOut) && (
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <i className="ri-close-line"></i>
              <span className="text-sm font-medium">{t('propertyDetail.clear')}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Seçilen tarih bilgisi */}
      {(selectedCheckIn || selectedCheckOut) && (
        <div className="mb-4 p-4 bg-gradient-to-r from-[#FDF8E7] to-emerald-50 border border-[#F5E190] rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#D4AF37] rounded-full"></div>
                <div>
                  <span className="text-xs text-gray-500 block">{t('booking.checkIn')}</span>
                  <span className="font-semibold text-gray-900">
                    {selectedCheckIn ? formatDisplayDate(selectedCheckIn) : t('propertyDetail.notSelected')}
                  </span>
                </div>
              </div>
              <i className="ri-arrow-right-line text-gray-400"></i>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedCheckOut ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
                <div>
                  <span className="text-xs text-gray-500 block">{t('booking.checkOut')}</span>
                  <span className="font-semibold text-gray-900">
                    {selectedCheckOut ? formatDisplayDate(selectedCheckOut) : t('propertyDetail.selectDate')}
                  </span>
                </div>
              </div>
            </div>
            {selectedCheckIn && selectedCheckOut && (
              <div className="text-right">
                <span className="text-xs text-gray-500 block">{t('booking.total')}</span>
                <span className="font-bold text-lg text-[#B8960D]">
                  {Math.ceil((selectedCheckOut.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24))} {t('calendar.night')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={previousMonth}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer border border-gray-200"
          >
            <i className="ri-arrow-left-s-line text-xl text-gray-600"></i>
          </button>
          <h3 className="text-xl font-bold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button 
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer border border-gray-200"
          >
            <i className="ri-arrow-right-s-line text-xl text-gray-600"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-500 py-2 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {[...Array(startingDayOfWeek)].map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}
          
          {[...Array(daysInMonth)].map((_, index) => {
            const day = index + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = isDateSelected(day);
            const isCheckIn = isSelectedCheckIn(day);
            const isCheckOut = isSelectedCheckOut(day);
            const isInRange = isDateInRange(day);
            const isBooked = isDateBooked(date);
            const isBookedCheckIn = isCheckInDate(date);
            const isBookedCheckOut = isCheckOutDate(date);
            const isPast = isDateInPast(date);
            const isDisabled = isBooked || isPast;
            const isHovered = hoveredDate && date.getTime() === hoveredDate.getTime();
            const tooltipContent = getTooltipContent(date);
            const booking = getBookingForDate(date);
            
            return (
              <div
                key={day}
                className="relative group"
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <button
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative overflow-hidden
                    ${isCheckIn ? 'bg-[#D4AF37] text-white shadow-lg ring-2 ring-[#B8960D]' : ''}
                    ${isCheckOut ? 'bg-rose-500 text-white shadow-lg ring-2 ring-rose-600' : ''}
                    ${isInRange ? 'bg-[#FAF0C8] text-[#7A6109]' : ''}
                    ${isBooked && !isBookedCheckOut ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                    ${isBookedCheckIn && isBooked ? 'bg-red-200' : ''}
                    ${isPast && !isBooked && !isBookedCheckOut ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${!isSelected && !isInRange && !isDisabled && !isBookedCheckOut ? 'hover:bg-gray-100 text-gray-900 cursor-pointer' : ''}
                    ${isDisabled && !isBooked && !isBookedCheckOut ? 'cursor-not-allowed' : ''}
                    ${isBookedCheckOut && !isPast && !isSelected ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                >
                  {/* Çıkış günü için özel görünüm (yarı dolu) */}
                  {isBookedCheckOut && !isPast && !isSelected && !isBooked && (
                    <div className="absolute inset-0 flex overflow-hidden rounded-lg">
                      <div className="w-1/2 bg-red-100"></div>
                      <div className="w-1/2 bg-white"></div>
                    </div>
                  )}
                  
                  {/* Gün numarası */}
                  <span className={`relative z-10 ${isBooked && !isBookedCheckOut ? 'line-through' : ''}`}>
                    {day}
                  </span>
                  
                  {/* Rezervasyon durumu ikonu */}
                  {isBooked && !isBookedCheckOut && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <i className={`text-xs ${booking?.status === 'confirmed' ? 'ri-lock-fill text-red-500' : 'ri-time-fill text-orange-500'}`}></i>
                    </span>
                  )}
                  
                  {/* Bugün işareti */}
                  {date.toDateString() === new Date().toDateString() && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
                  )}
                </button>
                
                {/* Tooltip */}
                {isHovered && tooltipContent && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-pre-line z-10 min-w-max shadow-xl">
                    {tooltipContent}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#D4AF37] rounded-md shadow-sm"></div>
              <span className="text-gray-600">Giriş Tarihi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-rose-500 rounded-md shadow-sm"></div>
              <span className="text-gray-600">Çıkış Tarihi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#FAF0C8] rounded-md border border-[#F5E190]"></div>
              <span className="text-gray-600">Seçili Aralık</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center">
                <i className="ri-lock-fill text-red-500 text-xs"></i>
              </div>
              <span className="text-gray-600">Dolu / Satışa Kapalı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center">
                <i className="ri-time-fill text-orange-500 text-xs"></i>
              </div>
              <span className="text-gray-600">Beklemede</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md overflow-hidden flex border border-gray-200">
                <div className="w-1/2 bg-red-100"></div>
                <div className="w-1/2 bg-white"></div>
              </div>
              <span className="text-gray-600">Çıkış Günü (Müsait)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded-md border border-gray-200 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
              </div>
              <span className="text-gray-600">Bugün</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
