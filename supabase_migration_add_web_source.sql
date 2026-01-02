-- Supabase'de bookings tablosuna 'web' kaynağını eklemek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- source için check constraint'i güncelle - 'web' ekle
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_source_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_source_check 
CHECK (source IN ('realtor', 'booking.com', 'airbnb', 'aylin_villas', 'web') OR source IS NULL);

-- Kolon açıklamasını güncelle
COMMENT ON COLUMN bookings.source IS 'Rezervasyon kaynağı: realtor, booking.com, airbnb, aylin_villas, web';

