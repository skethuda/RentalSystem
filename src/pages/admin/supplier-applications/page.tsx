import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { dbQuery, SupplierApplication } from '../../../lib/supabase';

export default function AdminSupplierApplications() {
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<SupplierApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await dbQuery('supplier_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Başvurular yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      // Başvuruyu güncelle
      const { error: updateError } = await dbQuery('supplier_applications')
        .eq('id', applicationId)
        .update({ 
          status, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Eğer onaylandıysa, kullanıcıyı app_users tablosuna ekle
      if (status === 'approved' && selectedApplication) {
        const { error: userError } = await dbQuery('app_users')
          .insert({
            first_name: selectedApplication.first_name,
            last_name: selectedApplication.last_name,
            email: selectedApplication.email,
            phone: selectedApplication.phone,
            role: 'supplier',
            company_name: selectedApplication.company_name,
            tax_number: selectedApplication.tax_number,
            address: selectedApplication.address,
            is_active: true,
            is_approved: true
          });

        if (userError) {
          console.error('Kullanıcı oluşturulurken hata:', userError);
        }
      }

      setSelectedApplication(null);
      setAdminNotes('');
      loadApplications();
      alert(status === 'approved' ? 'Başvuru onaylandı ve kullanıcı oluşturuldu.' : 'Başvuru reddedildi.');
    } catch (error: any) {
      console.error('İşlem hatası:', error);
      alert(`Hata: ${error?.message || 'Bir hata oluştu'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications;
    return applications.filter(a => a.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Beklemede</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Onaylandı</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Reddedildi</span>;
      default:
        return null;
    }
  };

  const getCountByStatus = (status: string) => applications.filter(a => a.status === status).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tedarikçi Başvuruları</h1>
          <p className="text-gray-600 mt-1">Villa/daire sahiplerinden gelen başvuruları inceleyin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-2xl text-orange-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Beklemede</p>
                <p className="text-2xl font-bold text-gray-900">{getCountByStatus('pending')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-check-line text-2xl text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Onaylanan</p>
                <p className="text-2xl font-bold text-gray-900">{getCountByStatus('approved')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-line text-2xl text-red-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reddedilen</p>
                <p className="text-2xl font-bold text-gray-900">{getCountByStatus('rejected')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-2xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'pending', label: 'Beklemede', icon: 'ri-time-line' },
            { key: 'approved', label: 'Onaylanan', icon: 'ri-check-line' },
            { key: 'rejected', label: 'Reddedilen', icon: 'ri-close-line' },
            { key: 'all', label: 'Tümü', icon: 'ri-list-check' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-[#D4AF37] text-[#B8960D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : getFilteredApplications().length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Başvuru bulunamadı</h3>
            <p className="text-gray-600">Bu kategoride henüz başvuru yok.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Başvuran</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">İletişim</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Firma</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Mülk Bilgisi</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Durum</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Tarih</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFilteredApplications().map(application => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{application.first_name} {application.last_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{application.email}</p>
                      <p className="text-sm text-gray-500">{application.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{application.company_name || '-'}</p>
                      {application.tax_number && (
                        <p className="text-xs text-gray-500">VKN: {application.tax_number}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{application.property_count || '?'} mülk</p>
                      <p className="text-xs text-gray-500">{application.property_locations || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {application.created_at ? new Date(application.created_at).toLocaleDateString('tr-TR') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-3 py-1 text-sm text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-colors"
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Başvuru Detayı</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Başvuran Bilgileri */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Başvuran Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Ad Soyad</p>
                    <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Firma</p>
                    <p className="font-medium">{selectedApplication.company_name || '-'}</p>
                  </div>
                  {selectedApplication.tax_number && (
                    <div>
                      <p className="text-sm text-gray-500">Vergi No</p>
                      <p className="font-medium">{selectedApplication.tax_number}</p>
                    </div>
                  )}
                  {selectedApplication.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Adres</p>
                      <p className="font-medium">{selectedApplication.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mülk Bilgileri */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Mülk Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Mülk Sayısı</p>
                    <p className="font-medium">{selectedApplication.property_count || 'Belirtilmedi'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Konumlar</p>
                    <p className="font-medium">{selectedApplication.property_locations || 'Belirtilmedi'}</p>
                  </div>
                </div>
              </div>

              {/* Mesaj */}
              {selectedApplication.message && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Mesaj</h3>
                  <p className="bg-gray-50 p-4 rounded-lg text-gray-700">{selectedApplication.message}</p>
                </div>
              )}

              {/* Admin Notları */}
              {selectedApplication.status === 'pending' ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Admin Notları</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Başvuru hakkında notlarınızı yazın..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              ) : selectedApplication.admin_notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Admin Notları</h3>
                  <p className="bg-gray-50 p-4 rounded-lg text-gray-700">{selectedApplication.admin_notes}</p>
                </div>
              )}

              {/* Durum */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Durum:</span>
                {getStatusBadge(selectedApplication.status)}
              </div>

              {/* Aksiyonlar */}
              {selectedApplication.status === 'pending' && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  {/* Bilgilendirme */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                      <div>
                        <p className="font-medium text-blue-800">Onaylama İşlemi</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Başvuruyu onayladığınızda, bu kişi otomatik olarak <strong>Tedarikçi</strong> olarak sisteme kaydedilecek 
                          ve villa/daire ekleyebilir duruma gelecektir.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedApplication.id!, 'rejected')}
                      disabled={processing}
                      className="flex-1 px-4 py-4 border-2 border-red-500 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <i className="ri-close-circle-line text-xl"></i>
                      )}
                      Başvuruyu Reddet
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApplication.id!, 'approved')}
                      disabled={processing}
                      className="flex-1 px-4 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <i className="ri-check-double-line text-xl"></i>
                      )}
                      Onayla ve Tedarikçi Olarak Kaydet
                    </button>
                  </div>
                </div>
              )}

              {/* Onaylanmış/Reddedilmiş bilgisi */}
              {selectedApplication.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <i className="ri-check-double-line text-green-600 text-xl"></i>
                    <div>
                      <p className="font-medium text-green-800">Başvuru Onaylandı</p>
                      <p className="text-sm text-green-700">Bu kişi tedarikçi olarak sisteme kaydedildi.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <i className="ri-close-circle-line text-red-600 text-xl"></i>
                    <div>
                      <p className="font-medium text-red-800">Başvuru Reddedildi</p>
                      <p className="text-sm text-red-700">Bu başvuru reddedilmiştir.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

