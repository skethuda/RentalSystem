import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dbQuery, SiteSettings } from '../../../lib/supabase';

interface ContactCardProps {
  propertyId: string;
}

export default function ContactCard({ propertyId }: ContactCardProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a2744] rounded-xl p-6 animate-pulse">
        <div className="h-40"></div>
      </div>
    );
  }

  if (!settings || (!settings.phone_primary && !settings.phone_whatsapp && !settings.email)) {
    return null;
  }

  const handleWhatsAppClick = () => {
    if (settings.phone_whatsapp) {
      const phone = settings.phone_whatsapp.replace(/\s+/g, '').replace('+', '');
      const message = encodeURIComponent(t('propertyDetail.whatsappMessage'));
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  const handlePhoneClick = () => {
    if (settings.phone_primary) {
      const phone = settings.phone_primary.replace(/\s+/g, '');
      window.open(`tel:${phone}`, '_self');
    }
  };

  return (
    <div className="bg-[#1a2744] rounded-xl p-6 relative">
      {/* Telefon İkonu */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-[#243656] border-2 border-white/20 rounded-full flex items-center justify-center">
          <i className="ri-phone-fill text-2xl text-white"></i>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-white italic mb-4">{t('propertyDetail.haveQuestion')}</h3>
        
        {/* Telefon Numarası */}
        {settings.phone_primary && (
          <button
            onClick={handlePhoneClick}
            className="flex items-center justify-center gap-3 w-full py-3 mb-3 text-white hover:text-orange-400 transition-colors group"
          >
            <i className="ri-headphone-fill text-2xl text-orange-400"></i>
            <span className="text-2xl font-bold">{settings.phone_primary}</span>
          </button>
        )}
        
        {/* WhatsApp Numarası */}
        {settings.phone_whatsapp && (
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center gap-3 w-full py-3 mb-4 text-white hover:text-green-400 transition-colors group"
          >
            <i className="ri-whatsapp-fill text-2xl text-green-400"></i>
            <span className="text-2xl font-bold">{settings.phone_whatsapp}</span>
          </button>
        )}
        
        {/* Email */}
        {settings.email && (
          <a 
            href={`mailto:${settings.email}?subject=${encodeURIComponent(t('propertyDetail.contactSubject'))}`}
            className="text-orange-400 font-semibold text-sm underline hover:text-orange-300 transition-colors block mb-4"
          >
            {settings.email}
          </a>
        )}
        
        {/* Açıklama */}
        {settings.contact_description && (
          <p className="text-gray-300 text-sm italic leading-relaxed">
            <span className="text-orange-400">{t('propertyDetail.villaRental')}</span> {settings.contact_description}
          </p>
        )}

        {/* Sosyal Medya Butonları */}
        {(settings.facebook_url || settings.instagram_url || settings.twitter_url) && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-blue-600 rounded-full transition-colors"
              >
                <i className="ri-facebook-fill text-white text-lg"></i>
              </a>
            )}
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-pink-600 rounded-full transition-colors"
              >
                <i className="ri-instagram-fill text-white text-lg"></i>
              </a>
            )}
            {settings.twitter_url && (
              <a
                href={settings.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-gray-700 rounded-full transition-colors"
              >
                <i className="ri-twitter-x-fill text-white text-lg"></i>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

