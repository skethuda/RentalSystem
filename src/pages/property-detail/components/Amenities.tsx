import { useTranslation } from 'react-i18next';
import { Amenity } from '../../../lib/supabase';

interface AmenitiesProps {
  amenities: Amenity[];
}

export default function Amenities({ amenities }: AmenitiesProps) {
  const { t } = useTranslation();
  
  if (amenities.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 pb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('propertyDetail.amenities')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {amenities.map((amenity) => (
          <div key={amenity.id} className="flex items-center space-x-3">
            <i className={`${amenity.icon} text-2xl text-gray-700`}></i>
            <span className="text-gray-700">{amenity.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
