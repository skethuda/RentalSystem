import { useTranslation } from 'react-i18next';
import { Property } from '../../../lib/supabase';

interface PropertyInfoProps {
  property: Property;
}

// Sabit admin/ev sahibi bilgileri - Her zaman Aylin Villas olarak görünecek
const HOST_INFO = {
  name: 'Aylin Villas',
  avatar: '/logo.png'
};

export default function PropertyInfo({ property }: PropertyInfoProps) {
  const { t } = useTranslation();
  return (
    <div className="border-b border-gray-200 pb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <i className="ri-star-fill text-[#FFA500]"></i>
              <span className="font-semibold">{property.rating}</span>
              <span className="text-gray-600">({property.review_count} {t('propertyDetail.review')})</span>
            </div>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600 underline cursor-pointer hover:text-gray-900">
              {[property.location, property.district, property.city].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <i className="ri-share-line text-xl"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <i className="ri-heart-line text-xl"></i>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-gray-700 mb-6">
        <div className="flex items-center space-x-2">
          <i className="ri-user-line text-xl"></i>
          <span>{property.max_guests} {t('propertyDetail.guest')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-hotel-bed-line text-xl"></i>
          <span>{property.bedrooms} {t('propertyDetail.bedroom')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-sofa-line text-xl"></i>
          <span>{property.living_rooms || 1} {t('propertyDetail.livingRoom')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-drop-line text-xl"></i>
          <span>{property.bathrooms} {t('propertyDetail.bathroom')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-home-line text-xl"></i>
          <span>{property.property_type}</span>
        </div>
      </div>

      {/* Ev Sahibi - Her zaman Aylin Villas bilgileri */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#FDF8E7] flex items-center justify-center overflow-hidden border-2 border-[#FAF0C8]">
          <img 
            src={HOST_INFO.avatar}
            alt={HOST_INFO.name}
            className="w-10 h-10 object-contain"
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{t('propertyDetail.host')} {HOST_INFO.name}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <i className="ri-verified-badge-fill text-[#D4AF37]"></i>
              {t('propertyDetail.hostTitle')}
            </span>
            <span>·</span>
            <span>{t('propertyDetail.hostExperience')}</span>
          </div>
        </div>
      </div>

      <div 
        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: property.description }}
      />
    </div>
  );
}
