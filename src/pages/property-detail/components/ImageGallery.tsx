import { useState } from 'react';
import { PropertyImage } from '../../../lib/supabase';

interface ImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const displayImages = images.length > 0 ? images : [
    {
      id: '1',
      property_id: '',
      image_url: 'https://readdy.ai/api/search-image?query=modern%20property%20exterior%20professional%20real%20estate%20photography&width=800&height=600&seq=default1&orientation=landscape',
      is_primary: true,
      display_order: 0,
      created_at: ''
    }
  ];

  const mainImage = displayImages[0];
  const sideImages = displayImages.slice(1, 5);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative grid grid-cols-4 gap-2 h-96 w-full rounded-xl overflow-hidden">
          {/* Main Image */}
          <div className="col-span-2 row-span-2 h-full w-full">
            <img 
              src={mainImage.image_url} 
              alt={title}
              className="w-full h-full object-cover object-top cursor-pointer hover:brightness-95 transition-all"
              onClick={() => setShowAllPhotos(true)}
            />
          </div>

          {/* Side Images */}
          {sideImages.map((image, index) => (
            <div key={image.id} className="h-48 w-full">
              <img 
                src={image.image_url} 
                alt={`${title} - ${index + 2}`}
                className="w-full h-full object-cover object-top cursor-pointer hover:brightness-95 transition-all"
                onClick={() => setShowAllPhotos(true)}
              />
            </div>
          ))}

          {/* Show All Photos Button */}
          {displayImages.length > 1 && (
            <button 
              onClick={() => setShowAllPhotos(true)}
              className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 shadow-md whitespace-nowrap cursor-pointer"
            >
              <i className="ri-grid-line"></i>
              <span>Tüm fotoğrafları göster</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Screen Photo Gallery Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <button 
                  onClick={() => setShowAllPhotos(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-white text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayImages.map((image, index) => (
                  <div key={image.id} className="w-full h-96">
                    <img 
                      src={image.image_url} 
                      alt={`${title} - ${index + 1}`}
                      className="w-full h-full object-cover object-top rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
