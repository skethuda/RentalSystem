import { useEffect, useState } from 'react';
import { dbQuery, Booking } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface BookingWithProperty extends Booking {
  properties?: {
    title: string;
    city: string;
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

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
      const { error } = await dbQuery('bookings')
        .eq('id', id)
        .update({ status });

      if (error) throw error;
      
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
    if (filter === 'all') return true;
    return b.status === filter;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rezervasyonlar</h1>
        <p className="text-gray-600">Tüm rezervasyonları görüntüleyin ve yönetin</p>
      </div>

      <div className="mb-6 flex items-center gap-3">
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
                      <p className="font-semibold text-gray-900">₺{booking.total_amount}</p>
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
    </AdminLayout>
  );
}
