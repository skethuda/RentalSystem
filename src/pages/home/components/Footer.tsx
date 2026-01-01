import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <footer className="bg-[#2C2C2C] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-64 w-full rounded-xl overflow-hidden">
              <img 
                src="https://readdy.ai/api/search-image?query=Cozy%20luxury%20hotel%20interior%20with%20warm%20ambient%20lighting%2C%20comfortable%20seating%20area%2C%20modern%20elegant%20decor%2C%20inviting%20atmosphere%2C%20professional%20hospitality%20photography%2C%20golden%20hour%20lighting%2C%20ultra%20realistic%2C%208k%20quality&width=800&height=400&seq=newsletter-bg-001&orientation=landscape"
                alt="Newsletter"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold mb-3">Fırsatları Kaçırmayın</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                E-posta adresinizi girerek özel tekliflerden ve kampanyalardan haberdar olun
              </p>
              <form onSubmit={handleSubscribe} className="flex space-x-3">
                <input 
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button type="submit" className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors flex items-center space-x-2 whitespace-nowrap">
                  <span>Abone Ol</span>
                  <i className="ri-arrow-right-line"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <img src="/logo.png" alt="Aylin Villas" className="h-14 object-contain brightness-0 invert" />
            </div>
            <p className="text-gray-400 text-sm">Türkiye'nin en güvenilir villa kiralama platformu</p>
          </div>

          {/* Keşfet */}
          <div>
            <h4 className="text-lg font-bold mb-4">Keşfet</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Popüler Destinasyonlar</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Yeni Eklenenler</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Özel Teklifler</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Destek */}
          <div>
            <h4 className="text-lg font-bold mb-4">Destek</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">İptal Politikası</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Güvenlik</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
            </ul>
          </div>

          {/* İş Ortaklığı */}
          <div>
            <h4 className="text-lg font-bold mb-4">İş Ortaklığı</h4>
            <ul className="space-y-2">
              <li>
                <a href="/supplier-application" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <i className="ri-home-heart-line"></i>
                  Villanızı Kiraya Verin
                </a>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Aracı Programı</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">İş Birliği Fırsatları</a></li>
            </ul>
          </div>

          {/* Sosyal Medya */}
          <div>
            <h4 className="text-lg font-bold mb-4">Bizi Takip Edin</h4>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-gray-600 rounded-full hover:border-white transition-colors">
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-gray-600 rounded-full hover:border-white transition-colors">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-gray-600 rounded-full hover:border-white transition-colors">
                <i className="ri-twitter-x-line text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-gray-600 rounded-full hover:border-white transition-colors">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2025 Aylin Villas. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Şartları</a>
            <a href="https://readdy.ai/?origin=logo" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              Powered by Readdy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
