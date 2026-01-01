import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dbQuery, AmenityOption, AMENITY_CATEGORIES, AppUser } from '../../../../lib/supabase';
import { TURKEY_CITIES, getDistrictsByCity } from '../../../../lib/turkeyData';
import AdminLayout from '../../components/AdminLayout';
import SeasonalPricingManager from '../components/SeasonalPricingManager';
import RoomBedManager from '../components/RoomBedManager';
import RichTextEditor from '../../../../components/RichTextEditor';

export default function NewProperty() {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    district: '',
    price_per_night: '',
    cleaning_fee: '',
    deposit: '',
    bedrooms: '',
    living_rooms: '',
    bathrooms: '',
    max_guests: '',
    property_type: 'Villa',
    minimum_nights: '1',
    is_featured: false,
    is_available: true,
    supplier_id: '',
  });

  // Tedarikçiler (supplier ve agent)
  const [suppliers, setSuppliers] = useState<AppUser[]>([]);
  
  // Şehir değiştiğinde ilçeleri güncelle
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const [images, setImages] = useState<Array<{ url: string; file?: File }>>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  
  // Yeni olanak sistemi
  const [availableAmenities, setAvailableAmenities] = useState<AmenityOption[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);

  useEffect(() => {
    loadAvailableAmenities();
    loadSuppliers();
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await dbQuery('app_users')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('first_name', { ascending: true })
        .execute();

      if (error) throw error;
      // Filter suppliers and agents client-side
      const filtered = (data || []).filter((u: AppUser) => u.role === 'supplier' || u.role === 'agent');
      setSuppliers(filtered);
    } catch (error) {
      console.error('Tedarikçiler yüklenirken hata:', error);
    }
  };

  // Şehir değiştiğinde ilçeleri güncelle
  useEffect(() => {
    if (formData.city) {
      const districts = getDistrictsByCity(formData.city);
      setAvailableDistricts(districts);
      // Eğer mevcut ilçe yeni şehirde yoksa, ilçeyi sıfırla
      if (!districts.includes(formData.district)) {
        setFormData(prev => ({ ...prev, district: '' }));
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.city]);

  const loadAvailableAmenities = async () => {
    try {
      const { data, error } = await dbQuery('amenity_options')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .execute();

      if (error) throw error;
      setAvailableAmenities(data || []);
    } catch (error) {
      console.error('Olanaklar yüklenirken hata:', error);
    } finally {
      setAmenitiesLoading(false);
    }
  };

  const loadProperty = async () => {
    try {
      setInitialLoading(true);
      
      // Konaklama bilgilerini yükle
      const { data: propertyData, error: propertyError } = await dbQuery('properties')
        .select('*')
        .eq('id', id!)
        .single()
        .execute();

      if (propertyError) throw propertyError;

      if (propertyData) {
        setFormData({
          title: propertyData.title || '',
          description: propertyData.description || '',
          location: propertyData.location || '',
          city: propertyData.city || '',
          district: propertyData.district || '',
          price_per_night: propertyData.price_per_night.toString(),
          cleaning_fee: propertyData.cleaning_fee?.toString() || '0',
          deposit: propertyData.deposit?.toString() || '0',
          bedrooms: propertyData.bedrooms.toString(),
          living_rooms: propertyData.living_rooms?.toString() || '1',
          bathrooms: propertyData.bathrooms.toString(),
          max_guests: propertyData.max_guests.toString(),
          property_type: propertyData.property_type,
          minimum_nights: propertyData.minimum_nights.toString(),
          is_featured: propertyData.is_featured,
          is_available: propertyData.is_available,
          supplier_id: propertyData.supplier_id || '',
        });
      }

      // Resimleri yükle
      const { data: imagesData, error: imagesError } = await dbQuery('property_images')
        .select('*')
        .eq('property_id', id!)
        .order('display_order', { ascending: true })
        .execute();

      if (imagesError) throw imagesError;

      if (imagesData && imagesData.length > 0) {
        const loadedImages = imagesData.map((img: any) => ({ url: img.image_url }));
        setImages(loadedImages);
        
        const primaryIndex = imagesData.findIndex((img: any) => img.is_primary);
        if (primaryIndex !== -1) {
          setPrimaryImageIndex(primaryIndex);
        }
      }

      // Seçili olanakları yükle (yeni sistem)
      const { data: propertyAmenitiesData, error: propertyAmenitiesError } = await dbQuery('property_amenities')
        .select('amenity_option_id')
        .eq('property_id', id!)
        .execute();

      if (propertyAmenitiesError) throw propertyAmenitiesError;

      if (propertyAmenitiesData && propertyAmenitiesData.length > 0) {
        setSelectedAmenityIds(propertyAmenitiesData.map((pa: any) => pa.amenity_option_id));
      }

    } catch (error) {
      console.error('Konaklama yüklenirken hata:', error);
      alert('Konaklama yüklenirken bir hata oluştu');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages(prev => [...prev, { 
              url: event.target!.result as string,
              file: file 
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setImages(newImages);
    
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(newIndex);
    } else if (primaryImageIndex === newIndex) {
      setPrimaryImageIndex(index);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Kaydedilecek formData:', formData);
      console.log('Description değeri:', formData.description);
      console.log('Description uzunluğu:', formData.description?.length);
      
      // Tiptap boş içeriği <p></p> olarak döndürebilir, bunu temizle
      let cleanDescription = formData.description || '';
      if (cleanDescription === '<p></p>' || cleanDescription === '<p><br></p>') {
        cleanDescription = '';
      }
      
      const propertyData = {
        title: formData.title,
        description: cleanDescription,
        location: formData.location,
        city: formData.city,
        district: formData.district,
        price_per_night: parseInt(formData.price_per_night),
        cleaning_fee: parseInt(formData.cleaning_fee) || 0,
        deposit: (formData.deposit && formData.deposit.trim() !== '' && !isNaN(parseInt(formData.deposit))) 
          ? parseInt(formData.deposit) 
          : 0,
        bedrooms: parseInt(formData.bedrooms),
        living_rooms: parseInt(formData.living_rooms) || 1,
        bathrooms: parseInt(formData.bathrooms),
        max_guests: parseInt(formData.max_guests),
        property_type: formData.property_type,
        minimum_nights: parseInt(formData.minimum_nights),
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        supplier_id: formData.supplier_id || null,
      };

      console.log('Kaydedilecek property verisi:', {
        formDataDeposit: formData.deposit,
        parsedDeposit: parseInt(formData.deposit),
        finalDeposit: propertyData.deposit,
        fullPropertyData: propertyData
      });

      if (isEditMode) {
        console.log('Property güncelleniyor, deposit değeri:', propertyData.deposit);
        console.log('Güncellenecek tüm veri:', JSON.stringify(propertyData, null, 2));
        
        const { error: propertyError, data: updateResult } = await dbQuery('properties')
          .eq('id', id!)
          .update(propertyData);

        if (propertyError) {
          console.error('Property update hatası:', propertyError);
          console.error('Hata detayı:', JSON.stringify(propertyError, null, 2));
          throw propertyError;
        }
        
        console.log('Property başarıyla güncellendi, güncellenen veri:', updateResult);
        
        // Güncelleme sonrası veriyi tekrar yükle ve kontrol et
        const { data: verifyData, error: verifyError } = await dbQuery('properties')
          .select('id, deposit')
          .eq('id', id!)
          .single()
          .execute();
        
        if (!verifyError && verifyData) {
          console.log('Güncelleme sonrası deposit değeri:', verifyData.deposit);
        } else {
          console.error('Güncelleme doğrulama hatası:', verifyError);
        }

        // Eski resimleri ve olanakları sil
        const { error: imageDeleteError } = await dbQuery('property_images')
          .eq('property_id', id!)
          .delete();
        if (imageDeleteError) {
          console.error('property_images silinirken hata:', imageDeleteError);
          throw imageDeleteError;
        }

        const { error: amenityDeleteError } = await dbQuery('property_amenities')
          .eq('property_id', id!)
          .delete();
        if (amenityDeleteError) {
          console.error('property_amenities silinirken hata:', amenityDeleteError);
          throw amenityDeleteError;
        }

        // Yeni resimleri kaydet
        const imagePromises = images
          .filter(img => img.url.trim())
          .map(async (img, index) => {
            const { error } = await dbQuery('property_images').insert({
              property_id: id,
              image_url: img.url,
              is_primary: index === primaryImageIndex,
              display_order: index,
            });

            if (error) {
              console.error('property_images eklenirken hata:', error, img);
              throw error;
            }
          });

        // Yeni olanak sistemi ile kaydet
        const amenityPromises = selectedAmenityIds.map(async amenityId => {
          const { error } = await dbQuery('property_amenities').insert({
            property_id: id,
            amenity_option_id: amenityId,
          });

          if (error) {
            console.error('property_amenities eklenirken hata:', error, amenityId);
            throw error;
          }
        });

        await Promise.all([...imagePromises, ...amenityPromises]);

        alert('Konaklama yeri başarıyla güncellendi!');
      } else {
        const { data: propertyResult, error: propertyError } = await dbQuery('properties').insert([
          {
            ...propertyData,
            rating: 0,
            review_count: 0,
          },
        ]);

        if (propertyError) throw propertyError;

        const property = Array.isArray(propertyResult) ? propertyResult[0] : propertyResult;

        // Resimleri kaydet
        const imagePromises = images
          .filter(img => img.url.trim())
          .map(async (img, index) => {
            const { error } = await dbQuery('property_images').insert({
              property_id: property.id,
              image_url: img.url,
              is_primary: index === primaryImageIndex,
              display_order: index,
            });

            if (error) {
              console.error('property_images eklenirken hata:', error, img);
              throw error;
            }
          });

        // Yeni olanak sistemi ile kaydet
        const amenityPromises = selectedAmenityIds.map(async amenityId => {
          const { error } = await dbQuery('property_amenities').insert({
            property_id: property.id,
            amenity_option_id: amenityId,
          });

          if (error) {
            console.error('property_amenities eklenirken hata:', error, amenityId);
            throw error;
          }
        });

        await Promise.all([...imagePromises, ...amenityPromises]);

        alert('Konaklama yeri başarıyla eklendi!');
      }
      
      window.REACT_APP_NAVIGATE('/admin/properties');
    } catch (error) {
      console.error('İşlem hatası:', error);
      alert('Bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Olanak seçimi toggle
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Tüm kategorideki olanakları seç/kaldır
  const toggleCategoryAmenities = (category: string) => {
    const categoryAmenityIds = availableAmenities
      .filter(a => a.category === category)
      .map(a => a.id);
    
    const allSelected = categoryAmenityIds.every(id => selectedAmenityIds.includes(id));
    
    if (allSelected) {
      setSelectedAmenityIds(prev => prev.filter(id => !categoryAmenityIds.includes(id)));
    } else {
      setSelectedAmenityIds(prev => [...new Set([...prev, ...categoryAmenityIds])]);
    }
  };

  // Kategorilere göre grupla
  const groupedAmenities = availableAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityOption[]>);

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-[#D4AF37] animate-spin"></i>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <button
          onClick={() => window.REACT_APP_NAVIGATE('/admin/properties')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <i className="ri-arrow-left-line"></i>
          Geri Dön
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Konaklama Yerini Düzenle' : 'Yeni Konaklama Yeri Ekle'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Konaklama yeri bilgilerini güncelleyin' : 'Sisteme yeni bir konaklama yeri ekleyin'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temel Bilgiler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama *</label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => {
                  console.log('RichTextEditor onChange:', value);
                  setFormData({ ...formData, description: value });
                }}
                placeholder="Konaklama yeri hakkında detaylı bilgi yazın..."
                className="mb-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Metin formatlama, listeler, linkler ve görseller ekleyebilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              >
                <option value="">Şehir Seçin</option>
                {TURKEY_CITIES.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">İlçe *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
                disabled={!formData.city}
              >
                <option value="">{formData.city ? 'İlçe Seçin' : 'Önce şehir seçin'}</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Konum / Adres Detayı</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                placeholder="Örn: Denize sıfır, merkeze 5 dk yürüme mesafesi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tür *</label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              >
                <option>Villa</option>
                <option>Daire</option>
                <option>Butik Otel</option>
                <option>Bungalov</option>
                <option>Çiftlik Evi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tedarikçi / Mülk Sahibi
                <span className="text-xs text-gray-400 ml-2">(Admin bilgisi - frontendde görünmez)</span>
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
              >
                <option value="">Seçilmedi (Aylin Villas)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.first_name} {supplier.last_name}
                    {supplier.company_name && ` - ${supplier.company_name}`}
                    {' '}({supplier.role === 'supplier' ? 'Tedarikçi' : 'Aracı'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Bu bilgi sadece admin panelinde görünür. Müşteriler her zaman "Aylin Villas" iletişim bilgilerini görür.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Gecelik Fiyat (₺)
                </label>
                <input
                  type="number"
                  name="price_per_night"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="3000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Temizlik Ücreti (₺)
                </label>
                <input
                  type="number"
                  name="cleaning_fee"
                  value={formData.cleaning_fee}
                  onChange={(e) => setFormData({ ...formData, cleaning_fee: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depozito (₺)
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yatak Odası *</label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salon *</label>
              <input
                type="number"
                min="0"
                value={formData.living_rooms}
                onChange={(e) => setFormData({ ...formData, living_rooms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banyo *</label>
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Misafir *</label>
              <input
                type="number"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Konaklama (Gece) *</label>
              <input
                type="number"
                min="1"
                value={formData.minimum_nights}
                onChange={(e) => setFormData({ ...formData, minimum_nights: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
                required
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-sm font-medium text-gray-700">Öne Çıkan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-5 h-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-sm font-medium text-gray-700">Müsait</span>
              </label>
            </div>
          </div>
        </div>

        {/* Resimler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resimler</h2>
              <p className="text-sm text-gray-500 mt-1">{images.length} resim yüklendi</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 text-sm bg-[#D4AF37] hover:bg-[#B8960D] text-white rounded-lg transition-all whitespace-nowrap cursor-pointer">
              <i className="ri-upload-2-line"></i>
              Resim Yükle
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                  <div className="aspect-video w-full h-full">
                    <img 
                      src={img.url} 
                      alt={`Resim ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Ana Resim Badge */}
                  {primaryImageIndex === index && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-[#D4AF37] text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <i className="ri-star-fill"></i>
                      Ana Resim
                    </div>
                  )}

                  {/* Kontrol Butonları */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    {/* Ana Resim Yap */}
                    {primaryImageIndex !== index && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="w-10 h-10 flex items-center justify-center bg-[#D4AF37] hover:bg-[#B8960D] text-white rounded-lg transition-all"
                        title="Ana Resim Yap"
                      >
                        <i className="ri-star-line text-lg"></i>
                      </button>
                    )}

                    {/* Yukarı Taşı */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                        title="Yukarı Taşı"
                      >
                        <i className="ri-arrow-up-line text-lg"></i>
                      </button>
                    )}

                    {/* Aşağı Taşı */}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                        title="Aşağı Taşı"
                      >
                        <i className="ri-arrow-down-line text-lg"></i>
                      </button>
                    )}

                    {/* Sil */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                      title="Sil"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>

                  {/* Sıra Numarası */}
                  <div className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center bg-black/70 text-white text-sm font-medium rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <i className="ri-image-add-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-2">Henüz resim yüklenmedi</p>
              <p className="text-sm text-gray-400">Bilgisayarınızdan resim yüklemek için yukarıdaki butona tıklayın</p>
            </div>
          )}
        </div>

        {/* Olanaklar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Olanaklar</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedAmenityIds.length} olanak seçildi
              </p>
            </div>
            <a
              href="/admin/amenities"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#B8960D] hover:bg-[#FDF8E7] rounded-lg transition-all whitespace-nowrap"
            >
              <i className="ri-settings-3-line"></i>
              Olanakları Yönet
            </a>
          </div>

          {amenitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <i className="ri-loader-4-line text-2xl text-[#D4AF37] animate-spin"></i>
            </div>
          ) : availableAmenities.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <i className="ri-list-check text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500 mb-2">Henüz olanak tanımlanmamış</p>
              <a
                href="/admin/amenities"
                className="text-[#B8960D] hover:underline text-sm"
              >
                Olanak eklemek için tıklayın
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {AMENITY_CATEGORIES.map(category => {
                const categoryAmenities = groupedAmenities[category.value];
                if (!categoryAmenities || categoryAmenities.length === 0) return null;

                const allSelected = categoryAmenities.every(a => selectedAmenityIds.includes(a.id));
                const someSelected = categoryAmenities.some(a => selectedAmenityIds.includes(a.id));

                return (
                  <div key={category.value} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleCategoryAmenities(category.value)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          allSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : someSelected ? 'bg-[#FAF0C8] border-[#D4AF37]' : 'border-gray-300'
                        }`}>
                          {allSelected && <i className="ri-check-line text-white text-sm"></i>}
                          {someSelected && !allSelected && <i className="ri-subtract-line text-[#D4AF37] text-sm"></i>}
                        </div>
                        <i className={`${category.icon} text-gray-600`}></i>
                        <span className="font-medium text-gray-900">{category.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {categoryAmenities.filter(a => selectedAmenityIds.includes(a.id)).length}/{categoryAmenities.length}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryAmenities.map(amenity => (
                        <label
                          key={amenity.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedAmenityIds.includes(amenity.id)
                              ? 'border-[#D4AF37] bg-[#FDF8E7]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenityIds.includes(amenity.id)}
                            onChange={() => toggleAmenity(amenity.id)}
                            className="sr-only"
                          />
                          <i className={`${amenity.icon} text-lg ${
                            selectedAmenityIds.includes(amenity.id) ? 'text-[#B8960D]' : 'text-gray-400'
                          }`}></i>
                          <span className={`text-sm ${
                            selectedAmenityIds.includes(amenity.id) ? 'text-[#5C4907] font-medium' : 'text-gray-700'
                          }`}>
                            {amenity.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Oda & Yatak Bilgileri - Sadece düzenleme modunda göster */}
        {isEditMode && id && (
          <RoomBedManager 
            propertyId={id} 
            bedrooms={parseInt(formData.bedrooms) || 0}
            livingRooms={parseInt(formData.living_rooms) || 0}
          />
        )}

        {/* Sezonluk Fiyatlandırma - Sadece düzenleme modunda göster */}
        {isEditMode && id && (
          <SeasonalPricingManager propertyId={id} />
        )}

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#D4AF37] hover:bg-[#B8960D] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                {isEditMode ? 'Güncelleniyor...' : 'Kaydediliyor...'}
              </>
            ) : (
              <>
                <i className="ri-save-line"></i>
                {isEditMode ? 'Güncelle' : 'Kaydet'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.REACT_APP_NAVIGATE('/admin/properties')}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all whitespace-nowrap"
          >
            İptal
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
