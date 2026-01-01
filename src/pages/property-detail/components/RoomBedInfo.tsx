import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dbQuery, RoomBed, BED_TYPES } from '../../../lib/supabase';

interface RoomBedInfoProps {
  propertyId: string;
  bedrooms: number;
  livingRooms: number;
}

export default function RoomBedInfo({ propertyId, bedrooms, livingRooms }: RoomBedInfoProps) {
  const { t } = useTranslation();
  const [roomBeds, setRoomBeds] = useState<RoomBed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      loadRoomBeds();
    }
  }, [propertyId]);

  const loadRoomBeds = async () => {
    try {
      const { data, error } = await dbQuery('room_beds')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_type', { ascending: true })
        .order('room_name', { ascending: true })
        .execute();

      if (error) throw error;
      setRoomBeds(data || []);
    } catch (error) {
      console.error('Oda bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBedTypeLabel = (value: string) => {
    const bedType = BED_TYPES.find(b => b.value === value);
    return bedType ? bedType.label : value;
  };

  const getBedTypeIcon = (value: string) => {
    const bedType = BED_TYPES.find(b => b.value === value);
    return bedType ? bedType.icon : 'ri-hotel-bed-line';
  };

  // Veriler yoksa gösterme
  if (!loading && roomBeds.length === 0) {
    return null;
  }

  // Odaları grupla
  const bedroomBeds = roomBeds.filter(rb => rb.room_type === 'bedroom');
  const livingRoomBeds = roomBeds.filter(rb => rb.room_type === 'living_room');

  // Toplam yatak kapasitesi hesapla
  const totalBeds = roomBeds.reduce((acc, rb) => acc + rb.bed_count, 0);

  if (loading) {
    return (
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('propertyDetail.roomBedInfo')}</h2>
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('propertyDetail.roomBedInfo')}</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-[#FDF8E7] text-[#97790B] rounded-full">
            <i className="ri-hotel-bed-fill"></i>
            {bedrooms} {t('propertyDetail.bedrooms')}
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full">
            <i className="ri-sofa-fill"></i>
            {livingRooms} {t('propertyDetail.livingRooms')}
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full">
            <i className="ri-user-line"></i>
            {totalBeds} {t('propertyDetail.beds')}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('propertyDetail.room')}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('propertyDetail.bedType')}</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{t('propertyDetail.quantity')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Yatak Odaları */}
            {bedroomBeds.length > 0 && (
              <>
                <tr className="bg-[#FDF8E7]/50">
                  <td colSpan={3} className="px-6 py-2">
                    <span className="text-xs font-bold text-[#97790B] uppercase tracking-wider flex items-center gap-2">
                      <i className="ri-hotel-bed-fill"></i>
                      {t('propertyDetail.bedroomsPlural')}
                    </span>
                  </td>
                </tr>
                {bedroomBeds.map((rb) => (
                  <tr key={rb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{rb.room_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <i className={`${getBedTypeIcon(rb.bed_type)} text-[#D4AF37]`}></i>
                        {getBedTypeLabel(rb.bed_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#FAF0C8] text-[#97790B] font-bold rounded-full">
                        {rb.bed_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Salonlar */}
            {livingRoomBeds.length > 0 && (
              <>
                <tr className="bg-orange-50/50">
                  <td colSpan={3} className="px-6 py-2">
                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                      <i className="ri-sofa-fill"></i>
                      {t('propertyDetail.livingRoomsPlural')}
                    </span>
                  </td>
                </tr>
                {livingRoomBeds.map((rb) => (
                  <tr key={rb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{rb.room_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <i className={`${getBedTypeIcon(rb.bed_type)} text-orange-500`}></i>
                        {getBedTypeLabel(rb.bed_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 font-bold rounded-full">
                        {rb.bed_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Bilgilendirme */}
      <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
        <i className="ri-information-line"></i>
        {t('propertyDetail.bedInfo', { totalBeds, totalRooms: bedrooms + livingRooms })}
      </p>
    </div>
  );
}

