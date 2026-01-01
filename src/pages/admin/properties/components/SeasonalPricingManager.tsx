import { useState, useEffect } from 'react';
import { dbQuery } from '../../../../lib/supabase';

interface SeasonalPrice {
  id?: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

interface SeasonalPricingManagerProps {
  propertyId: string;
}

export default function SeasonalPricingManager({ propertyId }: SeasonalPricingManagerProps) {
  const [seasons, setSeasons] = useState<SeasonalPrice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SeasonalPrice>({
    season_name: '',
    start_date: '',
    end_date: '',
    price_per_night: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propertyId) {
      loadSeasons();
    }
  }, [propertyId]);

  const loadSeasons = async () => {
    try {
      const { data, error } = await dbQuery('seasonal_pricing')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true })
        .execute();

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Sezonlar yüklenirken hata:', error);
    }
  };

  const handleSave = async () => {
    if (!propertyId) {
      alert('Konaklama yeri ID\'si bulunamadı!');
      return;
    }

    if (!formData.season_name || !formData.start_date || !formData.end_date || !formData.price_per_night) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await dbQuery('seasonal_pricing')
          .eq('id', editingId)
          .update({
            season_name: formData.season_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            price_per_night: formData.price_per_night,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        alert('Sezon başarıyla güncellendi!');
      } else {
        const { error } = await dbQuery('seasonal_pricing')
          .insert({
            property_id: propertyId,
            season_name: formData.season_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            price_per_night: formData.price_per_night
          });

        if (error) throw error;
        alert('Sezon başarıyla eklendi!');
      }

      await loadSeasons();
      resetForm();
    } catch (error) {
      console.error('Sezon kaydedilirken hata:', error);
      alert('Sezon kaydedilirken bir hata oluştu: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (season: any) => {
    setFormData({
      season_name: season.season_name,
      start_date: season.start_date,
      end_date: season.end_date,
      price_per_night: season.price_per_night
    });
    setEditingId(season.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sezonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await dbQuery('seasonal_pricing')
        .eq('id', id)
        .delete();

      if (error) throw error;
      await loadSeasons();
    } catch (error) {
      console.error('Sezon silinirken hata:', error);
      alert('Sezon silinirken bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      season_name: '',
      start_date: '',
      end_date: '',
      price_per_night: 0
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sezonluk Fiyatlandırma</h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-[#B8960D] text-white text-sm font-medium rounded-lg hover:bg-[#97790B] transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Yeni Sezon Ekle
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sezon Adı
              </label>
              <input
                type="text"
                value={formData.season_name}
                onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                placeholder="Örn: Yaz Sezonu, Kış Sezonu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gecelik Fiyat (₺)
              </label>
              <input
                type="number"
                value={formData.price_per_night || ''}
                onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-[#B8960D] text-white text-sm font-medium rounded-lg hover:bg-[#97790B] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {seasons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="ri-calendar-line text-4xl mb-3 block"></i>
          <p className="text-sm">Henüz sezon eklenmemiş</p>
          <p className="text-xs mt-1">Farklı dönemler için özel fiyatlar belirleyin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#F0D258] transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{season.season_name}</h4>
                  <span className="px-3 py-1 bg-[#FAF0C8] text-[#97790B] text-xs font-medium rounded-full whitespace-nowrap">
                    ₺{season.price_per_night.toLocaleString('tr-TR')} / gece
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="ri-calendar-line"></i>
                  <span>{formatDate(season.start_date)}</span>
                  <i className="ri-arrow-right-line text-xs"></i>
                  <span>{formatDate(season.end_date)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => handleEdit(season)}
                  className="p-2 text-gray-600 hover:text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <i className="ri-edit-line text-lg"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(season.id!)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <i className="ri-delete-bin-line text-lg"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
