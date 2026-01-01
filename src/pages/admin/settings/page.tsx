import { useState, useEffect } from 'react';
import { dbQuery, SiteSettings } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import RichTextEditor from '../../../components/RichTextEditor';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    phone_primary: '',
    phone_whatsapp: '',
    email: '',
    address: '',
    working_hours: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    contact_description: '',
    house_rules: '',
    additional_info: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await dbQuery('site_settings')
        .select('*')
        .single()
        .execute();

      if (error && error.code !== 'PGRST116') {
        console.error('Ayarlar yüklenirken hata:', error);
        throw error;
      }

      if (data) {
        console.log('Yüklenen ayarlar:', data);
        setSettings({
          phone_primary: data.phone_primary || '',
          phone_whatsapp: data.phone_whatsapp || '',
          email: data.email || '',
          address: data.address || '',
          working_hours: data.working_hours || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          twitter_url: data.twitter_url || '',
          contact_description: data.contact_description || '',
          house_rules: data.house_rules || '',
          additional_info: data.additional_info || '',
        });
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: existing, error: existingError } = await dbQuery('site_settings')
        .select('id')
        .single()
        .execute();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      // Boş string'leri null'a çevir (opsiyonel alanlar için)
      const settingsToSave: any = {
        phone_primary: settings.phone_primary || '',
        phone_whatsapp: settings.phone_whatsapp || '',
        email: settings.email || '',
        address: settings.address || null,
        working_hours: settings.working_hours || null,
        facebook_url: settings.facebook_url || null,
        instagram_url: settings.instagram_url || null,
        twitter_url: settings.twitter_url || null,
        contact_description: settings.contact_description || null,
        house_rules: settings.house_rules || null,
        additional_info: settings.additional_info || null,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Güncelle
        console.log('Güncellenecek veri:', settingsToSave);
        const { data: updateResult, error: updateError } = await dbQuery('site_settings')
          .eq('id', existing.id)
          .update(settingsToSave);

        if (updateError) {
          console.error('Update hatası:', updateError);
          throw updateError;
        }

        console.log('Güncelleme sonucu:', updateResult);
        
        // Başarılı güncelleme sonrası veriyi tekrar yükle
        await loadSettings();
      } else {
        // Yeni kayıt
        console.log('Eklenecek veri:', settingsToSave);
        const { data: insertResult, error: insertError } = await dbQuery('site_settings')
          .insert(settingsToSave);

        if (insertError) {
          console.error('Insert hatası:', insertError);
          throw insertError;
        }

        console.log('Ekleme sonucu:', insertResult);
        
        // Başarılı ekleme sonrası veriyi tekrar yükle
        await loadSettings();
      }

      alert('Ayarlar başarıyla kaydedildi!');
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu: ' + (error.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Ayarları</h1>
        <p className="text-gray-600">İletişim bilgileri ve site ayarlarını yönetin</p>
      </div>

      <div className="space-y-6">
        {/* İletişim Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-phone-fill text-[#D4AF37]"></i>
            İletişim Bilgileri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-phone-line mr-2"></i>
                Telefon Numarası
              </label>
              <input
                type="text"
                value={settings.phone_primary}
                onChange={(e) => setSettings({ ...settings, phone_primary: e.target.value })}
                placeholder="444 61 06"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-whatsapp-line mr-2 text-green-500"></i>
                WhatsApp Numarası
              </label>
              <input
                type="text"
                value={settings.phone_whatsapp}
                onChange={(e) => setSettings({ ...settings, phone_whatsapp: e.target.value })}
                placeholder="+90 532 787 28 38"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-mail-line mr-2"></i>
                E-posta Adresi
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="rezervasyon@tatilvillam.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-time-line mr-2"></i>
                Çalışma Saatleri
              </label>
              <input
                type="text"
                value={settings.working_hours || ''}
                onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                placeholder="Pazartesi - Cumartesi: 09:00 - 18:00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-map-pin-line mr-2"></i>
                Adres
              </label>
              <textarea
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Şirket adresi..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-information-line mr-2"></i>
                İletişim Açıklaması
              </label>
              <textarea
                value={settings.contact_description || ''}
                onChange={(e) => setSettings({ ...settings, contact_description: e.target.value })}
                placeholder="Villa kiralama fiyatları hakkında detaylı bilgi alarak bütçenize uygun bir seçim yapın."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ek Bilgiler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-information-line text-[#D4AF37]"></i>
            Ek Bilgiler
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Bu bölümdeki içerikler ürün detay sayfalarında "Ek Bilgiler" bölümünde gösterilecektir. İki ayrı bölüm olarak yönetilebilir.
          </p>
          
          <div className="space-y-6">
            {/* Ev Kuralları */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-home-line mr-2 text-[#D4AF37]"></i>
                Ev Kuralları
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Bej renkli kutu içinde gösterilecek. Liste formatında yazabilirsiniz.
              </p>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <RichTextEditor
                  value={settings.house_rules || ''}
                  onChange={(value) => setSettings({ ...settings, house_rules: value })}
                  placeholder="Ev kurallarını buraya yazın (örnek: Giriş saati: 16:00, Çıkış saati: 10:00)..."
                />
              </div>
            </div>

            {/* Ek Bilgiler (İkonlu Liste) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-list-check mr-2 text-[#D4AF37]"></i>
                Ek Bilgiler (İkonlu Liste)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Liste formatında yazın. Her liste öğesi otomatik olarak ikonlu gösterilecektir. 
                <br />
                <span className="text-[#3B82F6]">Mavi ✓</span> (varsayılan), 
                <span className="text-[#F59E0B]"> Sarı !</span> (uyarı için class="warning"), 
                <span className="text-[#EF4444]"> Kırmızı ✕</span> (hata için class="error")
              </p>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <RichTextEditor
                  value={settings.additional_info || ''}
                  onChange={(value) => setSettings({ ...settings, additional_info: value })}
                  placeholder="Ek bilgileri liste formatında yazın..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-share-fill text-[#D4AF37]"></i>
            Sosyal Medya
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-facebook-fill mr-2 text-blue-600"></i>
                Facebook
              </label>
              <input
                type="url"
                value={settings.facebook_url || ''}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-instagram-fill mr-2 text-pink-500"></i>
                Instagram
              </label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-twitter-x-fill mr-2"></i>
                Twitter / X
              </label>
              <input
                type="url"
                value={settings.twitter_url || ''}
                onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Önizleme */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-eye-line text-[#D4AF37]"></i>
            Önizleme
          </h2>
          
          <div className="max-w-sm mx-auto">
            <div className="bg-[#1a2744] rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-[#1a2744] border-4 border-white rounded-full flex items-center justify-center mx-auto -mt-14 mb-4">
                <i className="ri-phone-fill text-3xl text-white"></i>
              </div>
              
              <h3 className="text-xl font-bold text-white italic mb-4">Bir sorunuz mu var?</h3>
              
              <p className="text-gray-300 text-sm mb-6">
                Detaylı bilgi almak için lütfen aşağıdaki telefon numaralarından <span className="text-orange-400 font-bold">120293</span> referans numarası ile bize ulaşın.
              </p>
              
              {settings.phone_primary && (
                <div className="flex items-center justify-center gap-2 text-white text-xl font-bold mb-2">
                  <i className="ri-headphone-fill text-orange-400"></i>
                  {settings.phone_primary}
                </div>
              )}
              
              {settings.phone_whatsapp && (
                <div className="flex items-center justify-center gap-2 text-white text-xl font-bold mb-4">
                  <i className="ri-whatsapp-fill text-green-400"></i>
                  {settings.phone_whatsapp}
                </div>
              )}
              
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="text-orange-400 font-semibold text-sm underline block mb-4">
                  {settings.email}
                </a>
              )}
              
              {settings.contact_description && (
                <p className="text-gray-300 text-sm italic">
                  <span className="text-orange-400">Villa kiralama</span> {settings.contact_description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#D4AF37] hover:bg-[#B8960D] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Kaydediliyor...
              </>
            ) : (
              <>
                <i className="ri-save-line"></i>
                Ayarları Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

