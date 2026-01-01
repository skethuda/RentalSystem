import { useState, useEffect } from 'react';
import { dbQuery, RoomBed, BED_TYPES } from '../../../../lib/supabase';

interface RoomBedManagerProps {
  propertyId: string;
  bedrooms: number;
  livingRooms: number;
}

export default function RoomBedManager({ propertyId, bedrooms, livingRooms }: RoomBedManagerProps) {
  const [roomBeds, setRoomBeds] = useState<RoomBed[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<RoomBed, 'id' | 'property_id' | 'created_at'>>({
    room_name: '',
    room_type: 'bedroom',
    bed_type: 'double',
    bed_count: 1
  });

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
    }
  };

  const handleSave = async () => {
    if (!formData.room_name || !formData.bed_type || formData.bed_count < 1) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await dbQuery('room_beds')
          .eq('id', editingId)
          .update({
            room_name: formData.room_name,
            room_type: formData.room_type,
            bed_type: formData.bed_type,
            bed_count: formData.bed_count
          });

        if (error) throw error;
        alert('Oda bilgisi güncellendi!');
      } else {
        const { error } = await dbQuery('room_beds')
          .insert({
            property_id: propertyId,
            room_name: formData.room_name,
            room_type: formData.room_type,
            bed_type: formData.bed_type,
            bed_count: formData.bed_count
          });

        if (error) throw error;
        alert('Oda bilgisi eklendi!');
      }

      await loadRoomBeds();
      resetForm();
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roomBed: RoomBed) => {
    setFormData({
      room_name: roomBed.room_name,
      room_type: roomBed.room_type,
      bed_type: roomBed.bed_type,
      bed_count: roomBed.bed_count
    });
    setEditingId(roomBed.id || null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu oda bilgisini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await dbQuery('room_beds')
        .eq('id', id)
        .delete();

      if (error) throw error;
      await loadRoomBeds();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız!');
    }
  };

  const resetForm = () => {
    setFormData({
      room_name: '',
      room_type: 'bedroom',
      bed_type: 'double',
      bed_count: 1
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getBedTypeLabel = (value: string) => {
    const bedType = BED_TYPES.find(b => b.value === value);
    return bedType ? bedType.label : value;
  };

  const getBedTypeIcon = (value: string) => {
    const bedType = BED_TYPES.find(b => b.value === value);
    return bedType ? bedType.icon : 'ri-hotel-bed-line';
  };

  // Odaları grupla
  const bedroomBeds = roomBeds.filter(rb => rb.room_type === 'bedroom');
  const livingRoomBeds = roomBeds.filter(rb => rb.room_type === 'living_room');

  // Toplam yatak kapasitesi
  const totalBeds = roomBeds.reduce((acc, rb) => acc + rb.bed_count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Oda & Yatak Bilgileri</h2>
          <p className="text-sm text-gray-500 mt-1">
            {bedrooms} yatak odası, {livingRooms} salon | Toplam {totalBeds} yatak
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#B8960D] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            Yatak Ekle
          </button>
        )}
      </div>

      {/* Ekleme/Düzenleme Formu */}
      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">
            {editingId ? 'Yatak Bilgisini Düzenle' : 'Yeni Yatak Ekle'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Oda Türü</label>
              <select
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value as 'bedroom' | 'living_room' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              >
                <option value="bedroom">Yatak Odası</option>
                <option value="living_room">Salon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Oda Adı</label>
              <input
                type="text"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                placeholder="Örn: Ana Yatak Odası"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yatak Tipi</label>
              <select
                value={formData.bed_type}
                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              >
                {BED_TYPES.map(bed => (
                  <option key={bed.value} value={bed.value}>{bed.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yatak Sayısı</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.bed_count}
                onChange={(e) => setFormData({ ...formData, bed_count: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#B8960D] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Yatak Odaları */}
      {bedroomBeds.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-hotel-bed-fill text-[#D4AF37]"></i>
            Yatak Odaları ({bedroomBeds.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Oda Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Yatak Tipi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Adet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bedroomBeds.map((rb) => (
                  <tr key={rb.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{rb.room_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <i className={`${getBedTypeIcon(rb.bed_type)} text-gray-400`}></i>
                        {getBedTypeLabel(rb.bed_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#FAF0C8] text-[#97790B] font-semibold rounded-full">
                        {rb.bed_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rb)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rb.id!)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-600 rounded-lg transition-all"
                          title="Sil"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salonlar */}
      {livingRoomBeds.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="ri-sofa-fill text-orange-500"></i>
            Salonlar ({livingRoomBeds.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Salon Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Yatak Tipi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Adet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {livingRoomBeds.map((rb) => (
                  <tr key={rb.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{rb.room_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <i className={`${getBedTypeIcon(rb.bed_type)} text-gray-400`}></i>
                        {getBedTypeLabel(rb.bed_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 font-semibold rounded-full">
                        {rb.bed_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rb)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rb.id!)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-600 rounded-lg transition-all"
                          title="Sil"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boş durum */}
      {roomBeds.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <i className="ri-hotel-bed-line text-4xl mb-3 block"></i>
          <p className="text-sm">Henüz yatak bilgisi eklenmemiş</p>
          <p className="text-xs mt-1">Her oda için yatak tiplerini ve sayılarını belirtin</p>
        </div>
      )}
    </div>
  );
}



