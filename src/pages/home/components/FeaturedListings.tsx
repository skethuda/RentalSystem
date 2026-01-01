import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dbQuery, Property } from '../../../lib/supabase';

interface PropertyWithImage extends Property {
  primary_image?: string;
}

export default function FeaturedListings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('FeaturedListings: Ürünler yükleniyor...');

      const { data: propertiesData, error: propertiesError } = await dbQuery('properties')
        .select('*')
        .eq('is_available', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6)
        .execute();

      if (propertiesError) {
        console.error('FeaturedListings: Properties error:', propertiesError);
        throw propertiesError;
      }

      console.log('FeaturedListings: Veri geldi:', propertiesData?.length, 'adet');

      if (!propertiesData) throw new Error('Veri gelmedi');

      // Her ürün için ana resmi al
      const propertiesWithImages = await Promise.all(
        (propertiesData || []).map(async (property: Property) => {
          try {
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
          } catch (error) {
            console.error('FeaturedListings: Image error for property', property.id, error);
            return { ...property, primary_image: null };
          }
        })
      );

      console.log('FeaturedListings: Resimlerle birlikte:', propertiesWithImages.length, 'adet');
      setProperties(propertiesWithImages);
    } catch (error) {
      console.error('Konaklama yerleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-product-shop>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C]">
            {t('home.featured')}
          </h2>
          <p className="text-gray-600 mt-2">{properties.length} {t('home.accommodations')}</p>
        </div>
        <a 
          href="/search"
          className="text-[#D4AF37] font-semibold hover:underline whitespace-nowrap flex items-center gap-1"
        >
          {t('home.viewAll')} <i className="ri-arrow-right-line"></i>
        </a>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('home.noFeatured')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <div className="relative h-56 w-full">
                <img 
                  src={property.primary_image || 'https://readdy.ai/api/search-image?query=modern%20property%20exterior%20professional%20real%20estate%20photography&width=800&height=600&seq=default&orientation=landscape'} 
                  alt={property.title}
                  className="w-full h-full object-cover object-top"
                />
                {property.is_featured && (
                  <div className="absolute top-4 left-4 bg-[#D4AF37] text-white px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold">{t('home.featuredBadge')}</span>
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(property.id);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors cursor-pointer"
                >
                  <i className={`${favorites.includes(property.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-700'} text-xl`}></i>
                </button>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600 truncate flex-1">
                    {[property.location, property.district, property.city].filter(Boolean).join(', ')}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <i className="ri-star-fill text-[#FFA500] text-sm"></i>
                    <span className="text-sm font-semibold text-gray-900">{property.rating}</span>
                    <span className="text-xs text-gray-500">({property.review_count})</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{property.title}</h3>

                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <span>{property.max_guests} {t('home.guests')}</span>
                  <span>·</span>
                  <span>{property.bedrooms} {t('home.beds')}</span>
                  <span>·</span>
                  <span>{property.bathrooms} {t('home.bathrooms')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ₺{property.price_per_night.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">{t('home.perNight')}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {property.property_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
