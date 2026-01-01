import { useEffect, useState } from 'react';
import { dbQuery, SiteReview } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../home/components/Footer';

export default function ReviewsPage() {
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
    <div className="min-h-screen bg-[#F7F7F5]">
      <Header />

      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-gray-500 uppercase mb-2">
            MİSAFİR YORUMLARI
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
            Misafirlerimiz Aylin Villas Hakkında Ne Diyor?
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Aylin Villas deneyimi yaşayan misafirlerimizin gerçek yorumlarını keşfedin.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <i className="ri-chat-quote-line text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Henüz yayınlanmış bir site yorumu bulunmuyor.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <article
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
                </article>
              ))}
            </div>

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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}


