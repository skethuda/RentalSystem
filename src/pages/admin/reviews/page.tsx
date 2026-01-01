import { useEffect, useState } from 'react';
import { dbQuery, Review } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface ReviewWithProperty extends Review {
  properties?: {
    title: string;
    city: string;
  };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // İlk olarak reviews al
      const { data: reviewsData, error } = await dbQuery('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;
      
      // Her review için property bilgisini al
      const reviewsWithProperties = await Promise.all(
        (reviewsData || []).map(async (review: any) => {
          const { data: propertyData } = await dbQuery('properties')
            .select('title, city')
            .eq('id', review.property_id)
            .single()
            .execute();
          return {
            ...review,
            properties: propertyData
          };
        })
      );
      
      setReviews(reviewsWithProperties || []);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await dbQuery('reviews').eq('id', id).delete();
      if (error) throw error;
      
      setReviews(reviews.filter(r => r.id !== id));
      alert('Yorum başarıyla silindi!');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız oldu!');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`ri-star-${star <= rating ? 'fill' : 'line'} text-yellow-400`}
          ></i>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yorumlar</h1>
        <p className="text-gray-600">Tüm yorumları görüntüleyin ve yönetin</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#FAF0C8] rounded-full flex items-center justify-center flex-shrink-0">
                    {review.user_avatar ? (
                      <img
                        src={review.user_avatar}
                        alt={review.user_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <i className="ri-user-line text-xl text-[#B8960D]"></i>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{review.user_name}</h3>
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{review.properties?.title}</strong> - {review.properties?.city}
                    </p>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-600 rounded-lg transition-all flex-shrink-0"
                  title="Sil"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <i className="ri-star-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Henüz yorum bulunmuyor</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
