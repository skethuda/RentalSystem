import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dbQuery, Property, PropertyImage, Amenity, Review } from '../../lib/supabase';
import ImageGallery from './components/ImageGallery';
import PropertyInfo from './components/PropertyInfo';
import RoomBedInfo from './components/RoomBedInfo';
import PricingTable from './components/PricingTable';
import AvailabilityCalendar from './components/AvailabilityCalendar';
import Amenities from './components/Amenities';
import Reviews from './components/Reviews';
import BookingCard from './components/BookingCard';
import ContactCard from './components/ContactCard';
import AdditionalInfo from '../home/components/AdditionalInfo';
import Footer from '../home/components/Footer';
import Header from '../../components/Header';

interface SeasonalPricing {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

export default function PropertyDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // URL'den gelen tarihleri oku
  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  const urlGuests = searchParams.get('guests');
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(
    urlCheckIn ? new Date(urlCheckIn) : null
  );
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(
    urlCheckOut ? new Date(urlCheckOut) : null
  );
  const [selectedGuests, setSelectedGuests] = useState<number>(
    urlGuests ? parseInt(urlGuests) : 2
  );
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [seasonalPricing, setSeasonalPricing] = useState<SeasonalPricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      console.log('PropertyDetail: Veri yükleniyor, id:', id);

      // Fetch property details
      const { data: propertyData, error: propertyError } = await dbQuery('properties')
        .select('*')
        .eq('id', id)
        .single()
        .execute();

      console.log('PropertyDetail: Property data:', propertyData);

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Fetch property images
      const { data: imagesData, error: imagesError } = await dbQuery('property_images')
        .select('*')
        .eq('property_id', id)
        .order('display_order', { ascending: true })
        .execute();

      if (imagesError) throw imagesError;
      setImages(imagesData || []);

      // Fetch amenities (yeni sistem - property_amenities + amenity_options)
      const { data: propertyAmenitiesData, error: propertyAmenitiesError } = await dbQuery('property_amenities')
        .select('amenity_option_id')
        .eq('property_id', id)
        .execute();

      if (propertyAmenitiesError) throw propertyAmenitiesError;

      if (propertyAmenitiesData && propertyAmenitiesData.length > 0) {
        const amenityIds = propertyAmenitiesData.map((pa: any) => pa.amenity_option_id);
        
        const { data: amenityOptionsData, error: amenityOptionsError } = await dbQuery('amenity_options')
          .select('*')
          .in('id', amenityIds)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('display_order', { ascending: true })
          .execute();

        if (amenityOptionsError) throw amenityOptionsError;

        // Amenity formatına dönüştür
        const formattedAmenities = (amenityOptionsData || []).map((ao: any) => ({
          id: ao.id,
          property_id: id!,
          name: ao.name,
          icon: ao.icon,
          category: ao.category,
          created_at: ao.created_at || ''
        }));

        setAmenities(formattedAmenities);
      } else {
        setAmenities([]);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await dbQuery('reviews')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false })
        .execute();

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch seasonal pricing
      const { data: seasonalData, error: seasonalError } = await dbQuery('seasonal_pricing')
        .select('*')
        .eq('property_id', id)
        .order('start_date', { ascending: true })
        .execute();

      if (seasonalError) throw seasonalError;
      setSeasonalPricing(seasonalData || []);

    } catch (error) {
      console.error('Konaklama yeri bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (checkIn: Date | null, checkOut: Date | null) => {
    setSelectedCheckIn(checkIn);
    setSelectedCheckOut(checkOut);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('propertyDetail.notFound')}</h2>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors whitespace-nowrap"
          >
            {t('propertyDetail.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Header isScrolled={isScrolled} />

      {/* Main Content */}
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Image Gallery */}
          <ImageGallery images={images} title={property.title} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <PropertyInfo property={property} />
              <RoomBedInfo 
                propertyId={property.id}
                bedrooms={property.bedrooms}
                livingRooms={property.living_rooms || 1}
              />
              <Amenities amenities={amenities} />
              <PricingTable 
                pricePerNight={property.price_per_night}
                cleaningFee={property.cleaning_fee || 0}
                deposit={property.deposit || 0}
                seasonalPricing={seasonalPricing}
              />
              <AvailabilityCalendar 
                propertyId={property.id}
                onDateSelect={handleDateSelect}
                minimumNights={property.minimum_nights || 1}
              />
              <AdditionalInfo />
              <Reviews 
                reviews={reviews}
                rating={property.rating}
                reviewCount={property.review_count}
              />
            </div>

            {/* Right Column - Booking & Contact Cards */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <BookingCard 
                  checkInDate={selectedCheckIn}
                  checkOutDate={selectedCheckOut}
                  property={property}
                  initialGuests={selectedGuests}
                />
                <ContactCard propertyId={property.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
