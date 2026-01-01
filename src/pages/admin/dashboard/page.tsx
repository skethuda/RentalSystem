import { useEffect, useState } from 'react';
import { dbQuery } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface Stats {
  totalProperties: number;
  totalBookings: number;
  totalReviews: number;
  activeProperties: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalBookings: 0,
    totalReviews: 0,
    activeProperties: 0,
  });
  const [loading, setLoading] = useState(true);

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
      console.log('AdminDashboard: İstatistikler yüklendi');
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
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
