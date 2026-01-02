import { useEffect, useState } from 'react';
import { dbQuery, Booking, Property, AppUser } from '../../../lib/supabase';
import { calculateAndAddCommissions } from '../../../lib/commission';
import AdminLayout from '../components/AdminLayout';

interface BookingWithProperty extends Booking {
  properties?: {
    title: string;
    city: string;
  };
}

interface SeasonalPrice {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [realtors, setRealtors] = useState<AppUser[]>([]);
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    property_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    special_requests: '',
    source: 'aylin_villas' as 'realtor' | 'booking.com' | 'airbnb' | 'aylin_villas',
    realtor_id: '',
    calculated_price: 0,
    total_amount: 0,
    status: 'confirmed' as string,
  });

  useEffect(() => {
    loadBookings();
    loadProperties();
    loadRealtors();
  }, []);

  useEffect(() => {
    if (formData.property_id && formData.check_in_date && formData.check_out_date) {
      calculatePrice();
    }
  }, [formData.property_id, formData.check_in_date, formData.check_out_date]);

  const loadProperties = async () => {
    try {
      const { data, error } = await dbQuery('properties')
        .select('*')
        .order('title', { ascending: true })
        .execute();
      
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Properties yüklenirken hata:', error);
    }
  };

  const loadRealtors = async () => {
    try {
      const { data, error } = await dbQuery('app_users')
        .select('*')
        .eq('role', 'realtor')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('first_name', { ascending: true })
        .execute();
      
      if (error) throw error;
      setRealtors(data || []);
    } catch (error) {
      console.error('Emlakçılar yüklenirken hata:', error);
    }
  };

  const loadSeasonalPrices = async (propertyId: string): Promise<SeasonalPrice[]> => {
    try {
      const { data, error } = await dbQuery('seasonal_pricing')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true })
        .execute();
      
      if (error) throw error;
      const prices = data || [];
      setSeasonalPrices(prices);
      return prices;
    } catch (error) {
      console.error('Sezonluk fiyatlar yüklenirken hata:', error);
      setSeasonalPrices([]);
      return [];
    }
  };

  const calculatePrice = async () => {
    if (!formData.property_id || !formData.check_in_date || !formData.check_out_date) {
      setCalculatedPrice(0);
      return;
    }

    try {
      // Property bilgilerini al
      const { data: propertyData } = await dbQuery('properties')
        .select('*')
        .eq('id', formData.property_id)
        .single()
        .execute();

      if (!propertyData) return;

      // Sezonluk fiyatları yükle ve bekle
      const prices = await loadSeasonalPrices(formData.property_id);

      // Fiyat hesapla
      const startDate = new Date(formData.check_in_date);
      const endDate = new Date(formData.check_out_date);
      let totalPrice = 0;

      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Bu tarih için uygun sezonu bul
        let matchingSeason = null;
        for (const season of prices) {
          const seasonStartStr = season.start_date.split('T')[0];
          const seasonEndStr = season.end_date.split('T')[0];
          
          if (dateStr >= seasonStartStr && dateStr <= seasonEndStr) {
            matchingSeason = season;
            break;
          }
        }

        // Sezon fiyatı varsa onu kullan, yoksa normal fiyat
        const nightPrice = matchingSeason ? matchingSeason.price_per_night : propertyData.price_per_night;
        totalPrice += nightPrice;

        // Bir sonraki güne geç
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Temizlik ücreti ve depozito ekle
      const cleaningFee = propertyData.cleaning_fee || 0;
      const deposit = propertyData.deposit || 0;
      const finalPrice = totalPrice + cleaningFee + deposit;

      setCalculatedPrice(finalPrice);
      setFormData({ ...formData, calculated_price: finalPrice, total_amount: finalPrice });
    } catch (error) {
      console.error('Fiyat hesaplanırken hata:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Tarih çakışması kontrolü
      const { data: existingBookings, error: checkError } = await dbQuery('bookings')
        .select('*')
        .eq('property_id', formData.property_id)
        .in('status', ['pending', 'confirmed'])
        .execute();

      if (checkError) throw checkError;

      const conflictingBookings = (existingBookings || []).filter((booking: any) => {
        const bookingCheckIn = booking.check_in_date.split('T')[0];
        const bookingCheckOut = booking.check_out_date.split('T')[0];
        return bookingCheckIn < formData.check_out_date && bookingCheckOut > formData.check_in_date;
      });

      if (conflictingBookings.length > 0) {
        alert('Seçilen tarihler için bu konaklama yeri zaten rezerve edilmiş. Lütfen farklı tarihler seçin.');
        setSaving(false);
        return;
      }

      // Rezervasyon oluştur
      const bookingData: any = {
        property_id: formData.property_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        adults: formData.adults,
        children: formData.children,
        special_requests: formData.special_requests || null,
        total_amount: formData.total_amount,
        calculated_price: formData.calculated_price,
        source: formData.source,
        realtor_id: formData.source === 'realtor' && formData.realtor_id ? formData.realtor_id : null,
        status: formData.status,
      };

      const { data: newBooking, error } = await dbQuery('bookings').insert(bookingData);

      if (error) throw error;

      // Eğer rezervasyon onaylandıysa komisyon hesapla
      if (formData.status === 'confirmed' && newBooking) {
        try {
          // Property bilgisini al
          const { data: propertyData } = await dbQuery('properties')
            .select('*')
            .eq('id', formData.property_id)
            .single()
            .execute();

          if (propertyData) {
            // newBooking array veya tek obje olabilir
            const bookingRecord = Array.isArray(newBooking) ? newBooking[0] : newBooking;
            if (bookingRecord) {
              // Kaydedilen booking'de source ve realtor_id eksik olabilir, formData'dan ekle
              const bookingWithSource = {
                ...bookingRecord,
                source: formData.source,
                realtor_id: formData.source === 'realtor' && formData.realtor_id ? formData.realtor_id : null
              };
              console.log('Komisyon hesaplama için booking verisi:', bookingWithSource);
              await calculateAndAddCommissions(bookingWithSource, propertyData);
            }
          }
        } catch (commissionError) {
          console.error('Komisyon hesaplanırken hata:', commissionError);
          // Komisyon hatası rezervasyon oluşturmayı engellemez
        }
      }

      alert('Rezervasyon başarıyla oluşturuldu!');
      setShowModal(false);
      resetForm();
      loadBookings();
    } catch (error: any) {
      console.error('Rezervasyon oluşturulurken hata:', error);
      alert('Rezervasyon oluşturulurken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      check_in_date: '',
      check_out_date: '',
      adults: 1,
      children: 0,
      special_requests: '',
      source: 'aylin_villas',
      realtor_id: '',
      calculated_price: 0,
      total_amount: 0,
      status: 'confirmed',
    });
    setCalculatedPrice(0);
    setSeasonalPrices([]);
  };

  const loadBookings = async () => {
    try {
      // İlk olarak bookings al
      const { data: bookingsData, error } = await dbQuery('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;
      
      // Her booking için property bilgisini al
      const bookingsWithProperties = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          const { data: propertyData } = await dbQuery('properties')
            .select('title, city')
            .eq('id', booking.property_id)
            .single()
            .execute();
          return {
            ...booking,
            properties: propertyData
          };
        })
      );
      
      setBookings(bookingsWithProperties || []);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      // Önce mevcut rezervasyonu al
      const booking = bookings.find(b => b.id === id);
      const previousStatus = booking?.status;

      const { error } = await dbQuery('bookings')
        .eq('id', id)
        .update({ status });

      if (error) throw error;

      // Eğer status 'confirmed' olduysa ve önceden 'confirmed' değilse komisyon hesapla
      if (status === 'confirmed' && previousStatus !== 'confirmed' && booking) {
        try {
          // Veritabanından güncel booking verisini al (source ve realtor_id dahil)
          const { data: updatedBooking } = await dbQuery('bookings')
            .select('*')
            .eq('id', id)
            .single()
            .execute();

          // Property bilgisini al
          const { data: propertyData } = await dbQuery('properties')
            .select('*')
            .eq('id', booking.property_id)
            .single()
            .execute();

          if (propertyData && updatedBooking) {
            console.log('Durum güncelleme - Komisyon hesaplanacak:', { bookingId: id, source: updatedBooking.source, realtorId: updatedBooking.realtor_id });
            await calculateAndAddCommissions(updatedBooking, propertyData);
          }
        } catch (commissionError) {
          console.error('Komisyon hesaplanırken hata:', commissionError);
          // Komisyon hatası durum güncellemeyi engellemez
        }
      }
      
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status } : b
      ));
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await dbQuery('bookings').eq('id', id).delete();
      if (error) throw error;
      
      setBookings(bookings.filter(b => b.id !== id));
      alert('Rezervasyon başarıyla silindi!');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız oldu!');
    }
  };

  const filteredBookings = bookings.filter(b => {
    // Durum filtresi
    const statusMatch = filter === 'all' || b.status === filter;
    
    // Kaynak filtresi
    const sourceMatch = sourceFilter === 'all' || b.source === sourceFilter;
    
    return statusMatch && sourceMatch;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Beklemede';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rezervasyonlar</h1>
          <p className="text-gray-600">Tüm rezervasyonları görüntüleyin ve yönetin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
        >
          <i className="ri-add-line"></i>
          Yeni Rezervasyon Ekle
        </button>
      </div>

      <div className="mb-6 space-y-4">
        {/* Durum Filtreleri */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Durum:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#D4AF37] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tümü ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-[#D4AF37] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Beklemede ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              filter === 'confirmed'
                ? 'bg-[#D4AF37] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Onaylandı ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
        </div>

        {/* Kaynak Filtreleri */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Kaynak:</span>
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              sourceFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tümü ({bookings.length})
          </button>
          <button
            onClick={() => setSourceFilter('aylin_villas')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              sourceFilter === 'aylin_villas'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Aylin Villas ({bookings.filter(b => b.source === 'aylin_villas').length})
          </button>
          <button
            onClick={() => setSourceFilter('realtor')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              sourceFilter === 'realtor'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Emlakçı ({bookings.filter(b => b.source === 'realtor').length})
          </button>
          <button
            onClick={() => setSourceFilter('booking.com')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              sourceFilter === 'booking.com'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Booking.com ({bookings.filter(b => b.source === 'booking.com').length})
          </button>
          <button
            onClick={() => setSourceFilter('airbnb')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              sourceFilter === 'airbnb'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Airbnb ({bookings.filter(b => b.source === 'airbnb').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Misafir
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Konaklama Yeri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tarihler
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Misafir Sayısı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kaynak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{booking.email}</p>
                        <p className="text-sm text-gray-500">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.properties?.title}</p>
                        <p className="text-sm text-gray-500">{booking.properties?.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {new Date(booking.check_in_date).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-gray-500">
                          {new Date(booking.check_out_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.adults} Yetişkin
                        {booking.children > 0 && `, ${booking.children} Çocuk`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">₺{Number(booking.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      {booking.calculated_price && Number(booking.calculated_price) !== Number(booking.total_amount) && (
                        <p className="text-xs text-gray-500 line-through">₺{Number(booking.calculated_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {booking.source && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          booking.source === 'aylin_villas' ? 'bg-[#D4AF37] text-white' :
                          booking.source === 'realtor' ? 'bg-orange-100 text-orange-700' :
                          booking.source === 'booking.com' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {booking.source === 'aylin_villas' ? 'Aylin Villas' :
                           booking.source === 'realtor' ? 'Emlakçı' :
                           booking.source === 'booking.com' ? 'Booking.com' :
                           'Airbnb'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.status || 'pending'}
                        onChange={(e) => updateStatus(booking.id!, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer whitespace-nowrap ${getStatusColor(booking.status)}`}
                      >
                        <option value="pending">Beklemede</option>
                        <option value="confirmed">Onaylandı</option>
                        <option value="cancelled">İptal Edildi</option>
                        <option value="completed">Tamamlandı</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteBooking(booking.id!)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-600 rounded-lg transition-all"
                          title="Sil"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-calendar-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Henüz rezervasyon bulunmuyor</p>
            </div>
          )}
        </div>
      )}

      {/* Yeni Rezervasyon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Yeni Rezervasyon Ekle</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Konaklama Yeri *</label>
                  <select
                    required
                    value={formData.property_id}
                    onChange={(e) => {
                      setFormData({ ...formData, property_id: e.target.value });
                      loadSeasonalPrices(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rezervasyon Kaynağı *</label>
                  <select
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as any, realtor_id: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    <option value="aylin_villas">Aylin Villas</option>
                    <option value="realtor">Emlakçı</option>
                    <option value="booking.com">Booking.com</option>
                    <option value="airbnb">Airbnb</option>
                  </select>
                </div>
              </div>

              {formData.source === 'realtor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emlakçı *</label>
                  <select
                    required
                    value={formData.realtor_id}
                    onChange={(e) => setFormData({ ...formData, realtor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {realtors.map(realtor => (
                      <option key={realtor.id} value={realtor.id}>
                        {realtor.first_name} {realtor.last_name}
                        {realtor.commission_rate && ` (%${realtor.commission_rate})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giriş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çıkış Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    min={formData.check_in_date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yetişkin Sayısı *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hesaplanan Fiyat (₺)</label>
                  <input
                    type="number"
                    readOnly
                    value={calculatedPrice.toFixed(2)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sistem tarafından otomatik hesaplanan fiyat</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Tutar (₺) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">İsterseniz fiyatı düzenleyebilirsiniz</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Özel İstekler</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
