import { useEffect, useState } from 'react';
import { dbQuery, Booking, Property } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface Stats {
  totalProperties: number;
  totalBookings: number;
  totalReviews: number;
  activeProperties: number;
}

interface BookingWithProperty extends Booking {
  property?: Property;
  guestName?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalBookings: 0,
    totalReviews: 0,
    activeProperties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [upcomingCheckouts, setUpcomingCheckouts] = useState<BookingWithProperty[]>([]);
  const [upcomingCheckins, setUpcomingCheckins] = useState<BookingWithProperty[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingWithProperty[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    console.log('AdminDashboard: İstatistikler yükleniyor...');
    try {
      // Her sorguyu ayrı ayrı çalıştır - hata yakalama için
      const properties = await dbQuery('properties').select('id').execute();
      console.log('AdminDashboard: Properties:', properties.data?.length);
      
      const bookings = await dbQuery('bookings').select('id').execute();
      console.log('AdminDashboard: Bookings:', bookings.data?.length);
      
      const activeProps = await dbQuery('properties').select('id').eq('is_available', true).execute();
      console.log('AdminDashboard: Active:', activeProps.data?.length);

      setStats({
        totalProperties: properties.data?.length || 0,
        totalBookings: bookings.data?.length || 0,
        totalReviews: 0, // reviews tablosu sorunlu olabilir
        activeProperties: activeProps.data?.length || 0,
      });

      // Son 10 günde çıkış yapacaklar
      await loadUpcomingCheckouts();
      
      // Yaklaşan girişler (sonraki 10 gün)
      await loadUpcomingCheckins();
      
      // Son işlemler (son 10 rezervasyon)
      await loadRecentBookings();

      console.log('AdminDashboard: İstatistikler yüklendi');
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingCheckouts = async () => {
    try {
      const today = new Date();
      const tenDaysLater = new Date();
      tenDaysLater.setDate(today.getDate() + 10);
      
      const todayStr = today.toISOString().split('T')[0];
      const tenDaysLaterStr = tenDaysLater.toISOString().split('T')[0];

      const { data: bookings, error } = await dbQuery('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .gte('check_out_date', todayStr)
        .lte('check_out_date', tenDaysLaterStr)
        .order('check_out_date', { ascending: true })
        .limit(10)
        .execute();

      if (error) throw error;

      const bookingsWithProperties = await Promise.all(
        (bookings || []).map(async (booking: Booking) => {
          try {
            const { data: property } = await dbQuery('properties')
              .select('*')
              .eq('id', booking.property_id)
              .single()
              .execute();

            return {
              ...booking,
              property: property || undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          } catch (error) {
            return {
              ...booking,
              property: undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          }
        })
      );

      setUpcomingCheckouts(bookingsWithProperties);
    } catch (error) {
      console.error('Yaklaşan çıkışlar yüklenirken hata:', error);
    }
  };

  const loadUpcomingCheckins = async () => {
    try {
      const today = new Date();
      const tenDaysLater = new Date();
      tenDaysLater.setDate(today.getDate() + 10);
      
      const todayStr = today.toISOString().split('T')[0];
      const tenDaysLaterStr = tenDaysLater.toISOString().split('T')[0];

      const { data: bookings, error } = await dbQuery('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .gte('check_in_date', todayStr)
        .lte('check_in_date', tenDaysLaterStr)
        .order('check_in_date', { ascending: true })
        .limit(10)
        .execute();

      if (error) throw error;

      const bookingsWithProperties = await Promise.all(
        (bookings || []).map(async (booking: Booking) => {
          try {
            const { data: property } = await dbQuery('properties')
              .select('*')
              .eq('id', booking.property_id)
              .single()
              .execute();

            return {
              ...booking,
              property: property || undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          } catch (error) {
            return {
              ...booking,
              property: undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          }
        })
      );

      setUpcomingCheckins(bookingsWithProperties);
    } catch (error) {
      console.error('Yaklaşan girişler yüklenirken hata:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const { data: bookings, error } = await dbQuery('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
        .execute();

      if (error) throw error;

      const bookingsWithProperties = await Promise.all(
        (bookings || []).map(async (booking: Booking) => {
          try {
            const { data: property } = await dbQuery('properties')
              .select('*')
              .eq('id', booking.property_id)
              .single()
              .execute();

            return {
              ...booking,
              property: property || undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          } catch (error) {
            return {
              ...booking,
              property: undefined,
              guestName: `${booking.first_name} ${booking.last_name}`
            };
          }
        })
      );

      setRecentBookings(bookingsWithProperties);
    } catch (error) {
      console.error('Son rezervasyonlar yüklenirken hata:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statCards = [
    {
      title: 'Toplam Konaklama',
      value: stats.totalProperties,
      icon: 'ri-home-4-line',
      color: 'bg-[#D4AF37]',
      bgColor: 'bg-[#FDF8E7]',
      textColor: 'text-[#B8960D]',
    },
    {
      title: 'Aktif Konaklama',
      value: stats.activeProperties,
      icon: 'ri-checkbox-circle-line',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Toplam Rezervasyon',
      value: stats.totalBookings,
      icon: 'ri-calendar-check-line',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Toplam Yorum',
      value: stats.totalReviews,
      icon: 'ri-star-line',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontrol Paneli</h1>
        <p className="text-gray-600">Hoş geldiniz! İşte sistemin genel durumu.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <i className={`${stat.icon} text-2xl ${stat.textColor}`}></i>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Son 10 Günde Çıkış Yapacaklar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-logout-box-line text-orange-500"></i>
                Son 10 Günde Çıkış Yapacaklar
              </h2>
              {upcomingCheckouts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Yaklaşan çıkış bulunmuyor</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingCheckouts.map((booking) => {
                    const daysUntil = getDaysUntil(booking.check_out_date);
                    return (
                      <div
                        key={booking.id}
                        className="p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{booking.guestName}</p>
                            <p className="text-sm text-gray-600">{booking.property?.title || 'Bilinmeyen Villa'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Çıkış: {formatDate(booking.check_out_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              daysUntil <= 3 ? 'bg-red-100 text-red-700' :
                              daysUntil <= 7 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Yaklaşan Girişler */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-login-box-line text-emerald-500"></i>
                Yaklaşan Girişler (10 Gün)
              </h2>
              {upcomingCheckins.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Yaklaşan giriş bulunmuyor</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingCheckins.map((booking) => {
                    const daysUntil = getDaysUntil(booking.check_in_date);
                    return (
                      <div
                        key={booking.id}
                        className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{booking.guestName}</p>
                            <p className="text-sm text-gray-600">{booking.property?.title || 'Bilinmeyen Villa'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Giriş: {formatDate(booking.check_in_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              daysUntil <= 3 ? 'bg-red-100 text-red-700' :
                              daysUntil <= 7 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Son İşlemler */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="ri-time-line text-[#D4AF37]"></i>
              Son İşlemler
            </h2>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Henüz işlem bulunmuyor</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Misafir</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Villa</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Giriş</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Çıkış</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tutar</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durum</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{booking.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.property?.title || 'Bilinmeyen'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(booking.check_in_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(booking.check_out_date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₺{booking.total_amount?.toLocaleString('tr-TR') || '0'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'Onaylandı' :
                             booking.status === 'cancelled' ? 'İptal' :
                             booking.status === 'completed' ? 'Tamamlandı' :
                             'Beklemede'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {booking.created_at ? formatDate(booking.created_at) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-line-chart-line text-[#D4AF37]"></i>
                Hızlı İşlemler
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/admin/properties/new')}
                  className="w-full flex items-center gap-3 p-4 bg-[#FDF8E7] hover:bg-[#FAF0C8] rounded-lg transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-add-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Yeni Konaklama Ekle</p>
                    <p className="text-sm text-gray-600">Sisteme yeni konaklama yeri ekleyin</p>
                  </div>
                </button>

                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/admin/bookings')}
                  className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-calendar-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rezervasyonları Görüntüle</p>
                    <p className="text-sm text-gray-600">Tüm rezervasyonları yönetin</p>
                  </div>
                </button>

                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/admin/properties')}
                  className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-home-4-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Konaklamaları Yönet</p>
                    <p className="text-sm text-gray-600">Mevcut konaklamaları düzenleyin</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-[#D4AF37]"></i>
                Sistem Bilgileri
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Veritabanı Durumu</span>
                  <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Son Güncelleme</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Sistem Versiyonu</span>
                  <span className="text-sm font-medium text-gray-900">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
