import { useTranslation } from 'react-i18next';
import { Review } from '../../../lib/supabase';

interface ReviewsProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
}

export default function Reviews({ reviews, rating, reviewCount }: ReviewsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="border-b border-gray-200 pb-8">
      <div className="flex items-center space-x-2 mb-6">
        <i className="ri-star-fill text-[#FFA500] text-2xl"></i>
        <h2 className="text-2xl font-bold text-gray-900">{rating} · {reviewCount} {t('propertyDetail.reviews')}</h2>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-600">{t('propertyDetail.noReviews')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-3">
              <div className="flex items-center space-x-3">
                <img 
                  src={review.user_avatar} 
                  alt={review.user_name}
                  className="w-12 h-12 rounded-full object-cover object-top"
                />
                <div>
                  <p className="font-semibold text-gray-900">{review.user_name}</p>
                  <p className="text-sm text-gray-600">{new Date(review.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(review.rating)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-[#FFA500] text-sm"></i>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
