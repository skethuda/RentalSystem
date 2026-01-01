import { useEffect, useState } from 'react';
import { dbQuery, SiteReview, supabase } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

type FormState = {
  id?: string;
  name: string;
  location: string;
  avatar_url: string;
  rating: string;
  comment: string;
  is_active: boolean;
  show_on_home: boolean;
  sort_order: string;
};

export default function AdminSiteReviews() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<SiteReview | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    location: '',
    avatar_url: '',
    rating: '5',
    comment: '',
    is_active: true,
    show_on_home: true,
    sort_order: '0',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const result = await dbQuery('site_reviews')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .execute();

      if (result.error && !result.data) {
        console.error('Site yorumları yüklenirken hata:', result.error);
        return;
      }

      setReviews(result.data || []);
    } catch (error) {
      console.error('Site yorumları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingReview(null);
    setForm({
      name: '',
      location: '',
      avatar_url: '',
      rating: '5',
      comment: '',
      is_active: true,
      show_on_home: true,
      sort_order: '0',
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (review: SiteReview) => {
    setEditingReview(review);
    setForm({
      id: review.id,
      name: review.name,
      location: review.location || '',
      avatar_url: review.avatar_url || '',
      rating: review.rating.toString(),
      comment: review.comment,
      is_active: review.is_active,
      show_on_home: review.show_on_home,
      sort_order: (review.sort_order ?? 0).toString(),
    });
    setImagePreview(review.avatar_url || null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        rating: parseInt(form.rating, 10) || 5,
        comment: form.comment.trim(),
        is_active: form.is_active,
        show_on_home: form.show_on_home,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };

      let result;
      if (editingReview?.id) {
        result = await dbQuery('site_reviews')
          .eq('id', editingReview.id)
          .update(payload);
      } else {
        result = await dbQuery('site_reviews').insert(payload);
      }

      if (result.error && !result.data) {
        console.error('Site yorumu kaydedilirken hata:', result.error);
        alert('Yorum kaydedilirken bir hata oluştu: ' + (result.error.message || 'Bilinmeyen hata'));
        return;
      }

      setShowModal(false);
      setEditingReview(null);
      await loadReviews();
    } catch (error: any) {
      console.error('Site yorumu kaydedilirken hata:', error);
      alert('Yorum kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin');
      return;
    }

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    try {
      setUploadingImage(true);

      // Dosya adını oluştur
      const fileExt = file.name.split('.').pop();
      const fileName = `site-reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Resim yükleme hatası:', uploadError);
        alert('Resim yüklenirken bir hata oluştu: ' + uploadError.message);
        return;
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Eski resmi sil (eğer varsa ve yeni bir resim yükleniyorsa)
      if (form.avatar_url && form.avatar_url.includes('supabase.co/storage')) {
        try {
          const oldFileName = form.avatar_url.split('/').pop()?.split('?')[0];
          if (oldFileName) {
            await supabase.storage
              .from('images')
              .remove([`site-reviews/${oldFileName}`]);
          }
        } catch (deleteError) {
          console.error('Eski resim silinirken hata:', deleteError);
          // Hata olsa bile devam et
        }
      }

      setForm({ ...form, avatar_url: publicUrl });
      setImagePreview(publicUrl);
    } catch (error: any) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, avatar_url: '' });
    setImagePreview(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu site yorumunu silmek istediğinize emin misiniz?')) return;

    try {
      const result = await dbQuery('site_reviews').eq('id', id).delete();
      if (result.error && !result.data) {
        console.error('Site yorumu silinirken hata:', result.error);
        alert('Silme işlemi sırasında hata oluştu: ' + (result.error.message || 'Bilinmeyen hata'));
        return;
      }
      await loadReviews();
    } catch (error: any) {
      console.error('Site yorumu silinirken hata:', error);
      alert('Silme işlemi sırasında hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const toggleActive = async (review: SiteReview) => {
    try {
      const result = await dbQuery('site_reviews')
        .eq('id', review.id)
        .update({ is_active: !review.is_active });
      if (result.error && !result.data) {
        console.error('Durum güncellenirken hata:', result.error);
        alert('Durum güncellenirken hata oluştu');
        return;
      }
      await loadReviews();
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const toggleHome = async (review: SiteReview) => {
    try {
      const result = await dbQuery('site_reviews')
        .eq('id', review.id)
        .update({ show_on_home: !review.show_on_home });
      if (result.error && !result.data) {
        console.error('Anasayfa durumu güncellenirken hata:', result.error);
        alert('Anasayfa durumu güncellenirken hata oluştu');
        return;
      }
      await loadReviews();
    } catch (error) {
      console.error('Anasayfa durumu güncellenirken hata:', error);
      alert('Anasayfa durumu güncellenirken hata oluştu');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`ri-star-${star <= rating ? 'fill' : 'line'} text-yellow-400`}
        ></i>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Yorumları</h1>
            <p className="text-gray-600 mt-1">
              Site genelinde gösterilecek yorumları yönetin. Bu yorumlar villa bazlı değil, genel memnuniyeti gösterir.
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
          >
            <i className="ri-add-line"></i>
            Yeni Yorum Ekle
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <i className="ri-chat-quote-line text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Henüz site yorumu eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {review.avatar_url ? (
                      <img
                        src={review.avatar_url}
                        alt={review.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img 
                        src="/logo.png" 
                        alt="Aylin Villas"
                        className="w-full h-full rounded-full object-contain p-1"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{review.name}</h3>
                      {review.location && (
                        <span className="text-xs text-gray-500">· {review.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(review)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        review.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {review.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      onClick={() => toggleHome(review)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        review.show_on_home
                          ? 'bg-[#FDF8E7] text-[#B8960D] border-[#F5E190]'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      Anasayfa
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEditModal(review)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600"
                    >
                      <i className="ri-pencil-line"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingReview ? 'Yorumu Düzenle' : 'Yeni Yorum Ekle'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingReview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İsim *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="İstanbul, Türkiye"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Fotoğrafı (Opsiyonel)
                  </label>
                  
                  {/* Resim Önizleme */}
                  {imagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Önizleme"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  )}

                  {/* Resim Yükleme */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        {uploadingImage ? (
                          <>
                            <i className="ri-loader-4-line text-xl text-[#D4AF37] animate-spin"></i>
                            <span className="text-sm text-gray-600">Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-upload-cloud-line text-xl text-gray-600"></i>
                            <span className="text-sm text-gray-600">
                              {imagePreview ? 'Resmi Değiştir' : 'Resim Yükle'}
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                    
                    {!imagePreview && (
                      <span className="text-xs text-gray-500">
                        Resim yüklenmezse logo gösterilecek
                      </span>
                    )}
                  </div>

                  {/* Manuel URL Girişi (Alternatif) */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Veya URL ile ekle
                    </label>
                    <input
                      type="text"
                      value={form.avatar_url}
                      onChange={(e) => {
                        setForm({ ...form, avatar_url: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan (1-5)</label>
                    <select
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r.toString()}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yorum Metni *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıralama (opsiyonel)
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                      />
                      <span className="text-sm text-gray-700">Aktif</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.show_on_home}
                        onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })}
                        className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                      />
                      <span className="text-sm text-gray-700">Anasayfada Göster</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingReview(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
                  >
                    {editingReview ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


