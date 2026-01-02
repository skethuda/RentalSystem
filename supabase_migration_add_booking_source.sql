-- Supabase'de bookings tablosuna rezervasyon kaynağı ve fiyat düzenleme kolonları eklemek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. calculated_price kolonunu ekle (sistem tarafından hesaplanan fiyat)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS calculated_price DECIMAL(10,2);

-- 2. source kolonunu ekle (rezervasyon kaynağı)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- 3. source için check constraint ekle
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_source_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_source_check 
CHECK (source IN ('realtor', 'booking.com', 'airbnb', 'aylin_villas') OR source IS NULL);

-- 4. realtor_id kolonunu ekle (eğer emlakçıdan geldiyse emlakçı ID'si)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS realtor_id UUID;

-- 5. realtor_id için foreign key constraint ekle (app_users tablosuna)
ALTER TABLE bookings 
ADD CONSTRAINT bookings_realtor_id_fkey 
FOREIGN KEY (realtor_id) 
REFERENCES app_users(id) 
ON DELETE SET NULL;

-- 6. Kolonlar için açıklamalar ekle
COMMENT ON COLUMN bookings.calculated_price IS 'Sistem tarafından otomatik hesaplanan fiyat (sezonluk fiyatlar dahil)';
COMMENT ON COLUMN bookings.source IS 'Rezervasyon kaynağı: realtor, booking.com, airbnb, aylin_villas';
COMMENT ON COLUMN bookings.realtor_id IS 'Eğer rezervasyon emlakçıdan geldiyse emlakçı kullanıcı ID''si';

-- Artık admin panelinden rezervasyon eklerken kaynak bilgisi ve fiyat düzenleme yapılabilir.

