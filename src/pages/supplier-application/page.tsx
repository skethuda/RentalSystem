import { useState } from 'react';
import { dbQuery } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function SupplierApplicationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    tax_number: '',
    address: '',
    property_count: '',
    property_locations: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await dbQuery('supplier_applications')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          company_name: formData.company_name || null,
          tax_number: formData.tax_number || null,
          address: formData.address || null,
          property_count: formData.property_count ? parseInt(formData.property_count) : null,
          property_locations: formData.property_locations || null,
          message: formData.message || null,
          status: 'pending'
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      console.error('Başvuru hatası:', error);
      alert(`Başvuru gönderilirken bir hata oluştu: ${error?.message || ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8E7] to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Başvurunuz Alındı!</h1>
          <p className="text-gray-600 mb-6">
            Tedarikçi başvurunuz başarıyla alındı. Ekibimiz başvurunuzu inceleyecek ve en kısa sürede sizinle iletişime geçecektir.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#B8960D] text-white rounded-lg font-medium hover:bg-[#97790B] transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8E7] to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="Aylin Villas" className="h-14" />
            </a>
            <a href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <i className="ri-arrow-left-line"></i>
              Ana Sayfa
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#FAF0C8] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-home-heart-line text-3xl text-[#B8960D]"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Mülkünüzü Bizimle Kiraya Verin
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Villa veya dairenizi Aylin Villas platformunda kiraya vererek gelir elde edin. 
            Profesyonel pazarlama, güvenli ödeme ve 7/24 destek hizmetlerimizden faydalanın.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-money-dollar-circle-line text-2xl text-blue-600"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Yüksek Kazanç</h3>
            <p className="text-sm text-gray-600">Piyasa değerinde fiyatlandırma ile maksimum gelir elde edin.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-shield-check-line text-2xl text-green-600"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Güvenli Ödeme</h3>
            <p className="text-sm text-gray-600">Ödemeleriniz güvenle hesabınıza aktarılır.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-customer-service-2-line text-2xl text-purple-600"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">7/24 Destek</h3>
            <p className="text-sm text-gray-600">Her zaman yanınızda olan profesyonel destek ekibi.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tedarikçi Başvuru Formu</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kişisel Bilgiler */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i className="ri-user-line text-[#B8960D]"></i>
                Kişisel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Soyadınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="E-posta adresiniz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Telefon numaranız"
                  />
                </div>
              </div>
            </div>

            {/* Firma Bilgileri */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i className="ri-building-line text-[#B8960D]"></i>
                Firma Bilgileri (Opsiyonel)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firma Adı</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Firma adı (varsa)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Numarası</label>
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Vergi numarası"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Adres bilgisi"
                />
              </div>
            </div>

            {/* Mülk Bilgileri */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i className="ri-home-4-line text-[#B8960D]"></i>
                Mülk Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mülk Sayısı</label>
                  <input
                    type="number"
                    value={formData.property_count}
                    onChange={(e) => setFormData({ ...formData, property_count: e.target.value })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Kaç adet mülkünüz var?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mülk Konumları</label>
                  <input
                    type="text"
                    value={formData.property_locations}
                    onChange={(e) => setFormData({ ...formData, property_locations: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Örn: Kaş, Kalkan, Fethiye"
                  />
                </div>
              </div>
            </div>

            {/* Mesaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ek Mesajınız</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Mülkleriniz hakkında detay vermek ister misiniz?"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-[#D4AF37] text-white rounded-xl font-bold text-lg hover:bg-[#B8960D] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Başvuru Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill text-2xl"></i>
                    <span>Başvuru Gönder</span>
                  </>
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500">
                <i className="ri-shield-check-line text-green-500 mr-1"></i>
                Bilgileriniz güvenle saklanır ve üçüncü şahıslarla paylaşılmaz.
              </p>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.
          <br />
          Sorularınız için: <a href="mailto:info@aylinvillas.com" className="text-[#B8960D] hover:underline">info@aylinvillas.com</a>
        </p>
      </div>
    </div>
  );
}

