import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Property, dbQuery } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface BookingModalProps {
  property: Property;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  totalAmount: number;
  onClose: () => void;
}

export default function BookingModal({
  property,
  checkInDate,
  checkOutDate,
  adults,
  children,
  totalAmount,
  onClose
}: BookingModalProps) {
  const { t } = useTranslation();
  const { user, appUser } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Kullanıcı giriş yapmışsa bilgileri otomatik doldur
  useEffect(() => {
    if (user && appUser) {
      setFormData(prev => ({
        ...prev,
        firstName: appUser.first_name || '',
        lastName: appUser.last_name || '',
        email: appUser.email || user.email || '',
        phone: appUser.phone || ''
      }));
    }
  }, [user, appUser]);

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tarih çakışması kontrolü - çıkış günü dahil değil
      const checkInStr = checkInDate.toISOString().split('T')[0];
      const checkOutStr = checkOutDate.toISOString().split('T')[0];

      const { data: existingBookings, error: checkError } = await dbQuery('bookings')
        .select('*')
        .eq('property_id', property.id)
        .in('status', ['pending', 'confirmed'])
        .execute();

      if (checkError) throw checkError;

      // Manuel tarih çakışma kontrolü
      const conflictingBookings = (existingBookings || []).filter((booking: any) => {
        const bookingCheckIn = booking.check_in_date.split('T')[0];
        const bookingCheckOut = booking.check_out_date.split('T')[0];
        return bookingCheckIn < checkOutStr && bookingCheckOut > checkInStr;
      });

      if (conflictingBookings.length > 0) {
        alert(t('booking.conflictError'));
        setLoading(false);
        return;
      }

      // Rezervasyon oluştur
      const bookingData: any = {
        property_id: property.id,
        user_id: user && appUser ? appUser.id : null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        adults,
        children,
        special_requests: formData.specialRequests || null,
        total_amount: totalAmount,
        source: 'web', // Web sitesinden gelen rezervasyonlar
        status: 'pending'
      };

      console.log('Rezervasyon verisi:', bookingData);

      const { error } = await dbQuery('bookings').insert(bookingData);

      if (error) {
        console.error('Supabase hatası:', error);
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Rezervasyon hatası:', error);
      
      let errorMessage = t('booking.error');
      
      if (error?.message) {
        errorMessage += `\n\nDetay: ${error.message}`;
      }
      if (error?.code) {
        errorMessage += `\nKod: ${error.code}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const modalContent = success ? (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-check-line text-3xl text-green-600"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('booking.success')}</h3>
        <p className="text-gray-600">
          {t('booking.success')}
          {user && appUser && (
            <span className="block mt-2 text-[#D4AF37]">
              Rezervasyonunuzu profilinizden takip edebilirsiniz.
            </span>
          )}
        </p>
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('booking.property')}</h2>
            {user && appUser && (
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <i className="ri-user-follow-line"></i>
                {appUser.first_name} olarak giriş yapıldı
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{property.title}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('booking.checkIn')}:</span>
                <p className="font-semibold text-gray-900">{checkInDate.toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <span className="text-gray-600">{t('booking.checkOut')}:</span>
                <p className="font-semibold text-gray-900">{checkOutDate.toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <span className="text-gray-600">{t('booking.guests')}:</span>
                <p className="font-semibold text-gray-900">{adults} {t('booking.adultsLabel')}, {children} {t('booking.childrenLabel')}</p>
              </div>
              <div>
                <span className="text-gray-600">{t('booking.totalAmount')}:</span>
                <p className="font-semibold text-[#D4AF37] text-lg">₺{totalAmount.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('booking.firstName')}</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                  placeholder={t('booking.firstName')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('booking.lastName')}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                  placeholder={t('booking.lastName')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{t('booking.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                readOnly={!!(user && appUser)}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm ${user && appUser ? 'bg-gray-100 text-gray-600' : ''}`}
                placeholder={t('booking.email')}
              />
              {user && appUser && (
                <p className="text-xs text-gray-500 mt-1">E-posta hesabınıza bağlıdır</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{t('booking.phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{t('booking.specialRequests')}</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm resize-none"
                placeholder="Varsa özel isteklerinizi buraya yazabilirsiniz..."
              />
              <p className="text-xs text-gray-500 mt-1">{formData.specialRequests.length}/500 karakter</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {t('booking.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {loading ? t('common.loading') : t('booking.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Modal'ı body'e portal ile render et - stacking context sorunlarını çözer
  return createPortal(modalContent, document.body);
}
