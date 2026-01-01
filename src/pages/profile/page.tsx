import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dbQuery, Booking, Property } from '../../lib/supabase';
import Footer from '../home/components/Footer';

interface BookingWithProperty extends Booking {
  property?: Property;
  notes?: BookingNote[];
}

interface BookingNote {
  id: string;
  booking_id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, appUser, signOut, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProperty | null>(null);
  const [newNote, setNewNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (appUser) {
      setProfileData({
        first_name: appUser.first_name || '',
        last_name: appUser.last_name || '',
        phone: appUser.phone || ''
      });
      loadBookings();
    }
  }, [appUser]);

  const loadBookings = async () => {
    if (!appUser?.email) return;
    
    try {
      setLoading(true);
      
      // Kullanıcının rezervasyonlarını getir
      const { data: bookingsData, error } = await dbQuery('bookings')
        .select('*')
        .eq('email', appUser.email)
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;

      // Her rezervasyon için property bilgilerini ve notları al
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          // Property bilgisi
          const { data: propertyData } = await dbQuery('properties')
            .select('*')
            .eq('id', booking.property_id)
            .single()
            .execute();

          // Notlar
          const { data: notesData } = await dbQuery('booking_notes')
            .select('*')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: true })
            .execute();

          return {
            ...booking,
            property: propertyData,
            notes: notesData || []
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim() || !selectedBooking || !appUser) return;
    
    setSendingNote(true);
    
    try {
      const { error } = await dbQuery('booking_notes')
        .insert({
          booking_id: selectedBooking.id,
          user_id: appUser.id,
          message: newNote.trim(),
          is_from_admin: false
        });

      if (error) throw error;

      // Notları yenile
      setNewNote('');
      await loadBookings();
      
      // Seçili rezervasyonu güncelle
      const updatedBooking = bookings.find(b => b.id === selectedBooking.id);
      if (updatedBooking) {
        setSelectedBooking(updatedBooking);
      }
    } catch (error) {
      console.error('Not gönderilirken hata:', error);
      alert('Not gönderilirken bir hata oluştu');
    } finally {
      setSendingNote(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    
    try {
      const { error } = await dbQuery('app_users')
        .eq('id', appUser?.id)
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone
        });

      if (error) throw error;

      setEditMode(false);
      alert('Profil güncellendi');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      alert('Profil güncellenirken bir hata oluştu');
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !appUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="Aylin Villas" className="h-14" />
            </a>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Merhaba, <span className="font-semibold">{appUser.first_name}</span>
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <i className="ri-logout-box-line mr-2"></i>
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#D4AF37] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className="ri-calendar-check-line mr-2"></i>
            Rezervasyonlarım
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#D4AF37] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className="ri-user-line mr-2"></i>
            Profilim
          </button>
        </div>

        {/* Content */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Rezervasyonlarım</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz rezervasyonunuz yok</h3>
                <p className="text-gray-600 mb-6">Hayalinizdeki tatil için hemen bir villa keşfedin!</p>
                <a
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors"
                >
                  <i className="ri-search-line"></i>
                  Konaklama Ara
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Property Image */}
                      <div className="w-full md:w-48 h-40 md:h-auto shrink-0">
                        <img
                          src={booking.property?.images?.[0] || 'https://via.placeholder.com/400x300'}
                          alt={booking.property?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {booking.property?.title || 'Konaklama'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {booking.property?.location}, {booking.property?.city}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status || 'pending')}`}>
                            {getStatusLabel(booking.status || 'pending')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Giriş</p>
                            <p className="font-semibold">{formatDate(booking.check_in_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Çıkış</p>
                            <p className="font-semibold">{formatDate(booking.check_out_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Misafir</p>
                            <p className="font-semibold">{booking.adults + booking.children} kişi</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Toplam</p>
                            <p className="font-semibold text-[#D4AF37]">₺{(booking.total_amount || 0).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowNoteModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <i className="ri-chat-1-line"></i>
                            Mesaj Gönder
                            {booking.notes && booking.notes.length > 0 && (
                              <span className="w-5 h-5 bg-[#D4AF37] text-white rounded-full text-xs flex items-center justify-center">
                                {booking.notes.length}
                              </span>
                            )}
                          </button>
                          <span className="text-xs text-gray-500">
                            Ref: {booking.reference_code || booking.id?.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil Bilgilerim</h2>
            
            <div className="bg-white rounded-xl p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg">{appUser.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg">{appUser.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500">{appUser.email}</p>
                  <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg">{appUser.phone || '-'}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors disabled:opacity-50"
                      >
                        {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
                    >
                      <i className="ri-pencil-line mr-2"></i>
                      Düzenle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowNoteModal(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mesajlar</h3>
                <p className="text-sm text-gray-600">
                  {selectedBooking.property?.title} - Ref: {selectedBooking.reference_code || selectedBooking.id?.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedBooking.notes && selectedBooking.notes.length > 0 ? (
                selectedBooking.notes.map(note => (
                  <div
                    key={note.id}
                    className={`flex ${note.is_from_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        note.is_from_admin
                          ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                          : 'bg-[#D4AF37] text-white rounded-tr-none'
                      }`}
                    >
                      <p className="text-sm">{note.message}</p>
                      <p className={`text-xs mt-2 ${note.is_from_admin ? 'text-gray-500' : 'text-white/70'}`}>
                        {new Date(note.created_at).toLocaleString('tr-TR')}
                        {note.is_from_admin && ' - Aylin Villas'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-chat-1-line text-4xl mb-2 block"></i>
                  <p>Henüz mesaj yok</p>
                </div>
              )}
            </div>

            {/* Send Message */}
            <div className="p-6 border-t border-gray-200 shrink-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !sendingNote) {
                      handleSendNote();
                    }
                  }}
                />
                <button
                  onClick={handleSendNote}
                  disabled={sendingNote || !newNote.trim()}
                  className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors disabled:opacity-50"
                >
                  {sendingNote ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <i className="ri-send-plane-line"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

