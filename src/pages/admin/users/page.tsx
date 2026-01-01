import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { dbQuery, AppUser, USER_ROLES, UserRole, Property } from '../../../lib/supabase';

interface PropertyWithImage extends Property {
  primary_image?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  
  // Tedarikçi ürünleri için state
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<AppUser | null>(null);
  const [supplierProperties, setSupplierProperties] = useState<PropertyWithImage[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'member' as UserRole,
    company_name: '',
    tax_number: '',
    address: '',
    notes: '',
    is_active: true,
    is_approved: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await dbQuery('app_users')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tedarikçinin ürünlerini yükle
  const loadSupplierProperties = async (supplier: AppUser) => {
    setSelectedSupplier(supplier);
    setShowPropertiesModal(true);
    setPropertiesLoading(true);

    try {
      const { data: propertiesData, error } = await dbQuery('properties')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;

      // Her ürün için ana resmi al
      const propertiesWithImages = await Promise.all(
        (propertiesData || []).map(async (property: any) => {
          const { data: imageData } = await dbQuery('property_images')
            .select('image_url')
            .eq('property_id', property.id)
            .eq('is_primary', true)
            .single()
            .execute();

          return {
            ...property,
            primary_image: imageData?.image_url
          };
        })
      );

      setSupplierProperties(propertiesWithImages);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
      setSupplierProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        company_name: formData.company_name || null,
        tax_number: formData.tax_number || null,
        address: formData.address || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
        is_approved: formData.is_approved
      };

      if (editingUser) {
        const { error } = await dbQuery('app_users')
          .eq('id', editingUser.id)
          .update(userData);

        if (error) throw error;
      } else {
        const { error } = await dbQuery('app_users')
          .insert(userData);

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      alert(`Kayıt sırasında bir hata oluştu: ${error?.message || ''}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      company_name: user.company_name || '',
      tax_number: user.tax_number || '',
      address: user.address || '',
      notes: user.notes || '',
      is_active: user.is_active,
      is_approved: user.is_approved
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında bir hata oluştu.');
    }
  };

  const toggleActive = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const toggleApproved = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_approved: !user.is_approved })
        .eq('id', user.id);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'member',
      company_name: '',
      tax_number: '',
      address: '',
      notes: '',
      is_active: true,
      is_approved: true
    });
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getRoleInfo = (role: UserRole) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[3];
  };

  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => u.role === activeTab);

  const getCountByRole = (role: UserRole) => users.filter(u => u.role === role).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            <p className="text-gray-600 mt-1">Tedarikçi, aracı ve üyeleri yönetin</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8960D] text-white rounded-lg hover:bg-[#97790B] transition-colors"
          >
            <i className="ri-user-add-line"></i>
            Yeni Kullanıcı Ekle
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-[#D4AF37] text-[#B8960D]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tümü ({users.length})
          </button>
          {USER_ROLES.map(role => (
            <button
              key={role.value}
              onClick={() => setActiveTab(role.value as UserRole)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === role.value
                  ? 'border-[#D4AF37] text-[#B8960D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={role.icon}></i>
              {role.label} ({getCountByRole(role.value as UserRole)})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-line text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kullanıcı yok</h3>
            <p className="text-gray-600 mb-4">Kullanıcı ekleyerek sistemi kullanmaya başlayabilirsiniz.</p>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-[#B8960D] text-white rounded-lg hover:bg-[#97790B] transition-colors"
            >
              İlk Kullanıcıyı Ekle
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Kullanıcı</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">İletişim</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Rol</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Durum</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${roleInfo.color}-100`}>
                            <i className={`${roleInfo.icon} text-${roleInfo.color}-600`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                            {user.company_name && (
                              <p className="text-sm text-gray-500">{user.company_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${roleInfo.color}-100 text-${roleInfo.color}-700`}>
                          <i className={roleInfo.icon}></i>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleActive(user)}
                            className={`text-xs px-2 py-1 rounded ${
                              user.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {user.is_active ? 'Aktif' : 'Pasif'}
                          </button>
                          {(user.role === 'supplier' || user.role === 'agent') && (
                            <button
                              onClick={() => toggleApproved(user)}
                              className={`text-xs px-2 py-1 rounded ${
                                user.is_approved
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {user.is_approved ? 'Onaylı' : 'Onay Bekliyor'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Tedarikçi/Aracı için Ürünleri Göster butonu */}
                          {(user.role === 'supplier' || user.role === 'agent') && (
                            <button
                              onClick={() => loadSupplierProperties(user)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ürünleri Göster"
                            >
                              <i className="ri-home-4-line"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-600 hover:text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <i className="ri-pencil-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Rolü *</label>
                <div className="grid grid-cols-4 gap-2">
                  {USER_ROLES.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.value as UserRole })}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                        formData.role === role.value
                          ? 'border-[#D4AF37] bg-[#FDF8E7]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <i className={`${role.icon} text-xl ${formData.role === role.value ? 'text-[#B8960D]' : 'text-gray-500'}`}></i>
                      <span className={`text-xs font-medium ${formData.role === role.value ? 'text-[#97790B]' : 'text-gray-600'}`}>
                        {role.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {(formData.role === 'supplier' || formData.role === 'agent') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Firma Adı</label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vergi No</label>
                      <input
                        type="text"
                        value={formData.tax_number}
                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-[#B8960D] rounded focus:ring-[#D4AF37]"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktif Kullanıcı</span>
                </label>
                {(formData.role === 'supplier' || formData.role === 'agent') && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                      className="w-5 h-5 text-[#B8960D] rounded focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-gray-700">Onaylı</span>
                  </label>
                )}
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
                  {saving ? 'Kaydediliyor...' : editingUser ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tedarikçi Ürünleri Modalı */}
      {showPropertiesModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedSupplier.first_name} {selectedSupplier.last_name} - Ürünleri
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSupplier.company_name && `${selectedSupplier.company_name} · `}
                  {selectedSupplier.role === 'supplier' ? 'Tedarikçi' : 'Aracı'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPropertiesModal(false);
                  setSelectedSupplier(null);
                  setSupplierProperties([]);
                }}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {propertiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : supplierProperties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-home-4-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz ürün yok</h3>
                  <p className="text-gray-600 mb-4">Bu tedarikçiye ait henüz bir ürün eklenmemiş.</p>
                  <button
                    onClick={() => {
                      setShowPropertiesModal(false);
                      window.REACT_APP_NAVIGATE('/admin/properties/new');
                    }}
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
                  >
                    Yeni Ürün Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Özet Bilgi */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <i className="ri-information-line text-blue-600 text-xl"></i>
                      <p className="text-blue-800">
                        Bu tedarikçiye ait <strong>{supplierProperties.length}</strong> adet ürün bulunuyor.
                      </p>
                    </div>
                  </div>

                  {/* Ürün Listesi */}
                  <div className="grid gap-4">
                    {supplierProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#D4AF37] transition-colors"
                      >
                        {/* Ürün Resmi */}
                        <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          {property.primary_image ? (
                            <img
                              src={property.primary_image}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-image-line text-2xl text-gray-400"></i>
                            </div>
                          )}
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {[property.location, property.district, property.city].filter(Boolean).join(', ')}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <i className="ri-hotel-bed-line"></i>
                              {property.bedrooms} Yatak
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-drop-line"></i>
                              {property.bathrooms} Banyo
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-user-line"></i>
                              {property.max_guests} Misafir
                            </span>
                          </div>
                        </div>

                        {/* Fiyat ve Durum */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg text-gray-900">
                            ₺{property.price_per_night.toLocaleString('tr-TR')}
                            <span className="text-sm font-normal text-gray-500">/gece</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              property.is_available 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {property.is_available ? 'Müsait' : 'Müsait Değil'}
                            </span>
                            {property.is_featured && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                Öne Çıkan
                              </span>
                            )}
                          </div>
                        </div>

                        {/* İşlem Butonları */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setShowPropertiesModal(false);
                              window.REACT_APP_NAVIGATE(`/admin/properties/edit/${property.id}`);
                            }}
                            className="p-2 text-gray-600 hover:text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <i className="ri-pencil-line"></i>
                          </button>
                          <button
                            onClick={() => window.open(`/property/${property.id}`, '_blank')}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Görüntüle"
                          >
                            <i className="ri-external-link-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {supplierProperties.length > 0 && (
              <div className="p-4 border-t border-gray-200 shrink-0 flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowPropertiesModal(false);
                    window.REACT_APP_NAVIGATE('/admin/properties/new');
                  }}
                  className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  Yeni Ürün Ekle
                </button>
                <button
                  onClick={() => {
                    setShowPropertiesModal(false);
                    setSelectedSupplier(null);
                    setSupplierProperties([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

