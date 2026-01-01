import { useEffect, useState } from 'react';
import { dbQuery, Property } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    console.log('AdminProperties: Yükleniyor...');
    try {
      const { data, error } = await dbQuery('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      console.log('AdminProperties: Sonuç:', { data: data?.length, error });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Konaklama yerleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu konaklama yerini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await dbQuery('properties').eq('id', id).delete();
      if (error) throw error;
      
      setProperties(properties.filter(p => p.id !== id));
      alert('Konaklama yeri başarıyla silindi!');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız oldu!');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await dbQuery('properties')
        .eq('id', id)
        .update({ is_available: !currentStatus });

      if (error) throw error;
      
      setProperties(properties.map(p => 
        p.id === id ? { ...p, is_available: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Konaklama Yerleri</h1>
            <p className="text-gray-600">Tüm konaklama yerlerini yönetin</p>
          </div>
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/admin/properties/new')}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#B8960D] text-white font-medium rounded-lg transition-all whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Yeni Ekle
          </button>
        </div>

        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Konaklama yeri veya şehir ara..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Konaklama Yeri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fiyat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Özellikler
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{property.title}</p>
                        <p className="text-sm text-gray-500">{property.property_type}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{property.district}, {property.city}</p>
                      {property.location && <p className="text-xs text-gray-500">{property.location}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">₺{property.price_per_night}</p>
                      <p className="text-xs text-gray-500">/ gece</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <i className="ri-hotel-bed-line"></i>
                          {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-user-line"></i>
                          {property.max_guests}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailability(property.id, property.is_available)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          property.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {property.is_available ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.REACT_APP_NAVIGATE(`/admin/properties/edit/${property.id}`)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
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

          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-home-4-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Henüz konaklama yeri bulunmuyor</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
