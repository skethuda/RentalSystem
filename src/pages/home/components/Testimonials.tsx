import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dbQuery, SiteReview } from '../../../lib/supabase';

export default function Testimonials() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<SiteReview | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const result = await dbQuery('site_reviews')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_home', true)
        .order('created_at', { ascending: false })
        .limit(3)
        .execute();

      if (result.error && !result.data) {
        console.error('Anasayfa yorumları yüklenirken hata:', result.error);
        return;
      }

      setReviews(result.data || []);
    } catch (error) {
      console.error('Anasayfa yorumları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (review: SiteReview) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`ri-star-${star <= rating ? 'fill' : 'line'} text-[#FFA500]`}
        ></i>
      ))}
    </div>
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C]">{t('home.testimonials')}</h2>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              {t('home.testimonialsDesc')}
            </p>
          </div>
          <a
            href="/reviews"
            className="hidden md:inline-flex items-center text-sm font-semibold text-[#D4AF37] hover:text-[#B8960D] transition-colors"
          >
            {t('home.viewAllReviews')}
            <i className="ri-arrow-right-line ml-1"></i>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <i className="ri-chat-quote-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 text-sm">{t('home.noReviews')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => handleReviewClick(review)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  {/* Resim Üstte */}
                  <div className="w-full h-48 bg-gray-100 overflow-hidden">
                    {review.avatar_url ? (
                      <img
                        src={review.avatar_url}
                        alt={review.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FDF8E7] to-[#FAF0C8]">
                        <img 
                          src="/logo.png" 
                          alt="Aylin Villas"
                          className="w-24 h-24 object-contain opacity-80"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Bilgiler Altta */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{review.name}</h4>
                      {renderStars(review.rating)}
                    </div>
                    {review.location && (
                      <p className="text-xs text-gray-500 mb-3">{review.location}</p>
                    )}
                    <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                      {review.comment}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <a
                href="/reviews"
                className="inline-flex items-center px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors font-semibold"
              >
                Tüm Yorumları Gör
                <i className="ri-arrow-right-line ml-2"></i>
              </a>
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && selectedReview && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                <div className="w-full h-64 bg-gray-100 overflow-hidden">
                  {selectedReview.avatar_url ? (
                    <img
                      src={selectedReview.avatar_url}
                      alt={selectedReview.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FDF8E7] to-[#FAF0C8]">
                      <img 
                        src="/logo.png" 
                        alt="Aylin Villas"
                        className="w-32 h-32 object-contain opacity-80"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-close-line text-xl text-gray-700"></i>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedReview.name}</h3>
                    {selectedReview.location && (
                      <p className="text-sm text-gray-600">{selectedReview.location}</p>
                    )}
                  </div>
                  {renderStars(selectedReview.rating)}
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500">
                    <i className="ri-calendar-line mr-2"></i>
                    {new Date(selectedReview.created_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed text-lg">
                  "{selectedReview.comment}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
