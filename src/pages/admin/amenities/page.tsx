import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { dbQuery, AmenityOption, AMENITY_CATEGORIES, AMENITY_ICONS } from '../../../lib/supabase';

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState<AmenityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityOption | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'ri-check-line',
    category: 'general',
    is_active: true,
    display_order: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      const { data, error } = await dbQuery('amenity_options')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })
        .execute();

      if (error) throw error;
      setAmenities(data || []);
    } catch (error: any) {
      console.error('Olanaklar yüklenirken hata:', error);
      // Tablo yoksa hata mesajı gösterme, sadece boş liste göster
      if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
        console.log('amenity_options tablosu henüz oluşturulmamış');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingAmenity) {
        // Güncelle
        const { error } = await dbQuery('amenity_options')
          .eq('id', editingAmenity.id)
          .update({
            name: formData.name,
            icon: formData.icon,
            category: formData.category,
            is_active: formData.is_active,
            display_order: formData.display_order
          });

        if (error) throw error;
      } else {
        // Yeni ekle
        const { error } = await dbQuery('amenity_options')
          .insert({
            name: formData.name,
            icon: formData.icon,
            category: formData.category,
            is_active: formData.is_active,
            display_order: formData.display_order
          });

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      loadAmenities();
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      alert(`Kayıt sırasında bir hata oluştu: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (amenity: AmenityOption) => {
    setEditingAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon: amenity.icon,
      category: amenity.category,
      is_active: amenity.is_active,
      display_order: amenity.display_order
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu olanağı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('amenity_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAmenities();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında bir hata oluştu.');
    }
  };

  const toggleActive = async (amenity: AmenityOption) => {
    try {
      const { error } = await supabase
        .from('amenity_options')
        .update({ is_active: !amenity.is_active })
        .eq('id', amenity.id);

      if (error) throw error;
      loadAmenities();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const resetForm = () => {
    setEditingAmenity(null);
    setFormData({
      name: '',
      icon: 'ri-check-line',
      category: 'general',
      is_active: true,
      display_order: 0
    });
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getCategoryLabel = (value: string) => {
    return AMENITY_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  // Kategorilere göre grupla
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityOption[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olanaklar</h1>
            <p className="text-gray-600 mt-1">Villa ve daireler için sunulan olanakları yönetin</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8960D] text-white rounded-lg hover:bg-[#97790B] transition-colors"
          >
            <i className="ri-add-line"></i>
            Yeni Olanak Ekle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FAF0C8] rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-[#B8960D]"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Olanak</p>
                <p className="text-2xl font-bold text-gray-900">{amenities.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-check-line text-2xl text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{amenities.filter(a => a.is_active).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-folder-line text-2xl text-purple-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kategori</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedAmenities).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : amenities.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-list-check text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz olanak eklenmemiş</h3>
            <p className="text-gray-600 mb-4">Olanaklar ekleyerek villa ve dairelerinize özellik tanımlayabilirsiniz.</p>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-[#B8960D] text-white rounded-lg hover:bg-[#97790B] transition-colors"
            >
              İlk Olanağı Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {AMENITY_CATEGORIES.map(category => {
              const categoryAmenities = groupedAmenities[category.value];
              if (!categoryAmenities || categoryAmenities.length === 0) return null;

              return (
                <div key={category.value} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                    <i className={`${category.icon} text-xl text-gray-600`}></i>
                    <h3 className="font-semibold text-gray-900">{category.label}</h3>
                    <span className="ml-auto text-sm text-gray-500">{categoryAmenities.length} olanak</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {categoryAmenities.map(amenity => (
                      <div key={amenity.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${amenity.is_active ? 'bg-[#FAF0C8]' : 'bg-gray-100'}`}>
                            <i className={`${amenity.icon} text-xl ${amenity.is_active ? 'text-[#B8960D]' : 'text-gray-400'}`}></i>
                          </div>
                          <div>
                            <p className={`font-medium ${amenity.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                              {amenity.name}
                            </p>
                            <p className="text-sm text-gray-500">Sıra: {amenity.display_order}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(amenity)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              amenity.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {amenity.is_active ? 'Aktif' : 'Pasif'}
                          </button>
                          <button
                            onClick={() => handleEdit(amenity)}
                            className="p-2 text-gray-600 hover:text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-colors"
                          >
                            <i className="ri-pencil-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(amenity.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAmenity ? 'Olanak Düzenle' : 'Yeni Olanak Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Olanak Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Örn: Wi-Fi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {AMENITY_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Seçili İkon Önizleme */}
                  <div className="bg-gray-50 p-3 flex items-center gap-3 border-b border-gray-200">
                    <div className="w-12 h-12 bg-[#FAF0C8] rounded-lg flex items-center justify-center">
                      <i className={`${formData.icon} text-2xl text-[#B8960D]`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Seçili İkon</p>
                      <p className="text-xs text-gray-500">{formData.icon}</p>
                    </div>
                  </div>
                  
                  {/* İkon Grid */}
                  <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto p-2">
                    {AMENITY_ICONS.map((icon, index) => (
                      <button
                        key={`${icon}-${index}`}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        title={icon}
                        className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                          formData.icon === icon
                            ? 'bg-[#FAF0C8] text-[#B8960D] ring-2 ring-[#D4AF37] scale-110'
                            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <i className={`${icon} text-lg`}></i>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <i className="ri-information-line mr-1"></i>
                  Toplamda {AMENITY_ICONS.length} ikon mevcut. İkon seçilmezse varsayılan olarak <i className="ri-check-line"></i> kullanılır.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#B8960D] rounded focus:ring-[#D4AF37]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Aktif (Ürünlerde seçilebilir)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#B8960D] text-white rounded-lg hover:bg-[#97790B] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : editingAmenity ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

