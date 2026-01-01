import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    // Basit localStorage kontrolü - Supabase auth sorunlu
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    
    if (adminLoggedIn) {
      setUser({ email: 'admin@aylinvillas.com' });
      setLoading(false);
    } else {
      window.REACT_APP_NAVIGATE('/admin/login');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    window.REACT_APP_NAVIGATE('/admin/login');
  };

  const menuItems = [
    { icon: 'ri-dashboard-line', label: 'Kontrol Paneli', path: '/admin/dashboard' },
    { icon: 'ri-home-4-line', label: 'Konaklama Yerleri', path: '/admin/properties' },
    { icon: 'ri-calendar-check-line', label: 'Rezervasyonlar', path: '/admin/bookings' },
    { icon: 'ri-calendar-2-line', label: 'Rezervasyon Takvimi', path: '/admin/booking-calendar' },
    { icon: 'ri-star-line', label: 'Villa Yorumları', path: '/admin/reviews' },
    { icon: 'ri-chat-quote-line', label: 'Site Yorumları', path: '/admin/site-reviews' },
    { icon: 'ri-checkbox-circle-line', label: 'Olanaklar', path: '/admin/amenities' },
    { icon: 'ri-user-line', label: 'Kullanıcılar', path: '/admin/users' },
    { icon: 'ri-file-list-3-line', label: 'Tedarikçi Başvuruları', path: '/admin/supplier-applications' },
    { icon: 'ri-calculator-line', label: 'Muhasebe & Harcamalar', path: '/admin/expenses' },
    { icon: 'ri-settings-3-line', label: 'Ayarlar', path: '/admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center">
              <img src="/logo.png" alt="Aylin Villas" className="h-12 object-contain" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all"
          >
            <i className={`ri-${sidebarOpen ? 'menu-fold' : 'menu-unfold'}-line text-gray-600`}></i>
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => window.REACT_APP_NAVIGATE(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#FDF8E7] group ${
                window.location.pathname === item.path ? 'bg-[#FDF8E7] text-[#B8960D]' : 'text-gray-700'
              }`}
            >
              <i className={`${item.icon} text-xl`}></i>
              {sidebarOpen && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-50 text-red-600 group"
          >
            <i className="ri-logout-box-line text-xl"></i>
            {sidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Paneli</h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.REACT_APP_NAVIGATE('/')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all whitespace-nowrap"
              >
                <i className="ri-external-link-line"></i>
                Siteyi Görüntüle
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-[#FAF0C8] rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-[#B8960D]"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
