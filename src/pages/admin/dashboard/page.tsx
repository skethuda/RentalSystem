import { useEffect, useState } from 'react';
import { dbQuery, Booking, Property, LedgerAccount } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface Stats {
  totalProperties: number;
  totalBookings: number;
  totalReviews: number;
  activeProperties: number;
  totalBookingAmount: number;
  companyRevenue: number;
}

interface BookingWithProperty extends Booking {
  properties?: Property;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalBookings: 0,
    totalReviews: 0,
    activeProperties: 0,
    totalBookingAmount: 0,
    companyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithProperty[]>([]);
  const [checkoutBookings, setCheckoutBookings] = useState<BookingWithProperty[]>([]);

  useEffect(() => {
    loadStats();
    loadUpcomingBookings();
    loadCheckoutBookings();
  }, []);

  const loadStats = async () => {
    console.log('AdminDashboard: İstatistikler yükleniyor...');
    try {
      // Her sorguyu ayrı ayrı çalıştır - hata yakalama için
      const properties = await dbQuery('properties').select('id').execute();
      console.log('AdminDashboard: Properties:', properties.data?.length);
      
      const bookings = await dbQuery('bookings').select('*').execute();
      console.log('AdminDashboard: Bookings:', bookings.data?.length);
      
      const activeProps = await dbQuery('properties').select('id').eq('is_available', true).execute();
      console.log('AdminDashboard: Active:', activeProps.data?.length);

      // Toplam rezervasyon tutarı hesapla
      const totalBookingAmount = (bookings.data || []).reduce((sum: number, booking: Booking) => {
        return sum + (booking.total_amount || 0);
      }, 0);

      // Firma gelir durumu (company ledger account)
      let companyRevenue = 0;
      try {
        const { data: companyAccount } = await dbQuery('ledger_accounts')
          .select('*')
          .eq('user_role', 'company')
          .execute();
        
        if (companyAccount && companyAccount.length > 0) {
          // user_id null olan firma hesabını bul
          const firmAccount = companyAccount.find((acc: LedgerAccount) => acc.user_id === null);
          if (firmAccount) {
            companyRevenue = firmAccount.balance || 0;
          }
        }
      } catch (error) {
        console.error('Firma gelir durumu yüklenirken hata:', error);
      }

      setStats({
        totalProperties: properties.data?.length || 0,
        totalBookings: bookings.data?.length || 0,
        totalReviews: 0, // reviews tablosu sorunlu olabilir
        activeProperties: activeProps.data?.length || 0,
        totalBookingAmount,
        companyRevenue,
      });
      console.log('AdminDashboard: İstatistikler yüklendi');
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingBookings = async () => {
    try {
      const today = new Date();
      const tenDaysLater = new Date();
      tenDaysLater.setDate(today.getDate() + 10);

      const { data: bookings, error } = await dbQuery('bookings')
        .select('*')
        .gte('check_in_date', today.toISOString().split('T')[0])
        .lte('check_in_date', tenDaysLater.toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed'])
        .order('check_in_date', { ascending: true })
        .limit(10)
        .execute();

      if (error) throw error;

      // Her booking için property bilgisini al
      const bookingsWithProperties = await Promise.all(
        (bookings || []).map(async (booking: Booking) => {
          const { data: property } = await dbQuery('properties')
            .select('*')
            .eq('id', booking.property_id)
            .single()
            .execute();
          return {
            ...booking,
            properties: property
          };
        })
      );

      setUpcomingBookings(bookingsWithProperties);
    } catch (error) {
      console.error('Yaklaşan rezervasyonlar yüklenirken hata:', error);
    }
  };

  const loadCheckoutBookings = async () => {
    try {
      const today = new Date();
      const tenDaysLater = new Date();
      tenDaysLater.setDate(today.getDate() + 10);

      const { data: bookings, error } = await dbQuery('bookings')
        .select('*')
        .gte('check_out_date', today.toISOString().split('T')[0])
        .lte('check_out_date', tenDaysLater.toISOString().split('T')[0])
        .in('status', ['confirmed'])
        .order('check_out_date', { ascending: true })
        .limit(10)
        .execute();

      if (error) throw error;

      // Her booking için property bilgisini al
      const bookingsWithProperties = await Promise.all(
        (bookings || []).map(async (booking: Booking) => {
          const { data: property } = await dbQuery('properties')
            .select('*')
            .eq('id', booking.property_id)
            .single()
            .execute();
          return {
            ...booking,
            properties: property
          };
        })
      );

      setCheckoutBookings(bookingsWithProperties);
    } catch (error) {
      console.error('Çıkış yapılacak rezervasyonlar yüklenirken hata:', error);
    }
  };

  const statCards = [
    {
      title: 'Toplam Konaklama',
      value: stats.totalProperties,
      icon: 'ri-home-4-line',
      color: 'bg-[#D4AF37]',
      bgColor: 'bg-[#FDF8E7]',
      textColor: 'text-[#B8960D]',
      isAmount: false,
    },
    {
      title: 'Toplam Rezervasyon Tutarı',
      value: `₺${stats.totalBookingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: 'ri-money-dollar-circle-line',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      isAmount: true,
    },
    {
      title: 'Firma Gelir Durumu',
      value: `₺${stats.companyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: 'ri-bank-line',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      isAmount: true,
    },
    {
      title: 'Toplam Rezervasyon',
      value: stats.totalBookings,
      icon: 'ri-calendar-check-line',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      isAmount: false,
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
                <h3 className={`${stat.isAmount ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-1`}>{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Yaklaşan Rezervasyonlar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-calendar-event-line text-[#D4AF37]"></i>
                Son 10 Gün İçinde Yaklaşan Rezervasyonlar
              </h2>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-calendar-line text-4xl mb-2"></i>
                  <p>Yaklaşan rezervasyon bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {booking.first_name} {booking.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{booking.properties?.title}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Onaylandı' : 'Beklemede'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <i className="ri-calendar-check-line"></i>
                          <span>{new Date(booking.check_in_date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ri-calendar-close-line"></i>
                          <span>{new Date(booking.check_out_date).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900">
                        ₺{Number(booking.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Çıkış Yapılacak Rezervasyonlar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-logout-box-line text-orange-500"></i>
                Son 10 Gün İçinde Çıkış Yapılacak Rezervasyonlar
              </h2>
              {checkoutBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-calendar-line text-4xl mb-2"></i>
                  <p>Çıkış yapılacak rezervasyon bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {checkoutBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {booking.first_name} {booking.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{booking.properties?.title}</p>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Çıkış
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <i className="ri-calendar-check-line"></i>
                          <span>{new Date(booking.check_in_date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ri-calendar-close-line"></i>
                          <span className="font-medium text-orange-600">
                            {new Date(booking.check_out_date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900">
                        ₺{Number(booking.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
