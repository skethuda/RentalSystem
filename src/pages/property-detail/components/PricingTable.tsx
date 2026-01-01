interface SeasonalPricing {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

import { useTranslation } from 'react-i18next';

interface PricingTableProps {
  pricePerNight: number;
  cleaningFee: number;
  deposit: number;
  seasonalPricing?: SeasonalPricing[];
}

export default function PricingTable({ pricePerNight, cleaningFee, deposit, seasonalPricing = [] }: PricingTableProps) {
  const { t } = useTranslation();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Sezon yoksa hiç gösterme
  if (seasonalPricing.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 pb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('propertyDetail.pricingTable')}</h2>
      
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('propertyDetail.season')}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('propertyDetail.startDate')}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('propertyDetail.endDate')}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">{t('propertyDetail.pricePerNight')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Standart Fiyat Satırı */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4">
                <span className="font-medium text-gray-700">{t('propertyDetail.standardPrice')}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">-</td>
              <td className="px-6 py-4 text-sm text-gray-500">-</td>
              <td className="px-6 py-4 text-right">
                <span className="font-semibold text-gray-900">₺{pricePerNight.toLocaleString('tr-TR')}</span>
              </td>
            </tr>
            
            {/* Sezonluk Fiyatlar */}
            {seasonalPricing.map((season) => (
              <tr key={season.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{season.season_name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(season.start_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(season.end_date)}</td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-[#B8960D] text-lg">₺{season.price_per_night.toLocaleString('tr-TR')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Temizlik Ücreti ve Depozito Notu */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 space-y-2 text-sm text-gray-600">
          <div>
            <i className="ri-information-line mr-2"></i>
            {t('propertyDetail.cleaningFeeNote', { fee: `₺${cleaningFee.toLocaleString('tr-TR')}` })}
          </div>
          {deposit > 0 && (
            <div>
              <i className="ri-information-line mr-2"></i>
              {t('propertyDetail.depositNote', { deposit: `₺${deposit.toLocaleString('tr-TR')}` })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
