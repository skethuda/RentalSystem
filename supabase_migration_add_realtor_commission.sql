-- Supabase'de app_users tablosuna emlakçı komisyon oranı kolonu ve 'realtor' rolü eklemek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Önce mevcut role check constraint'ini kaldır
ALTER TABLE app_users 
DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Yeni role check constraint'ini ekle (realtor dahil)
ALTER TABLE app_users 
ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'supplier', 'agent', 'realtor', 'member'));

-- 3. commission_rate kolonunu ekle (emlakçı, aracı ve tedarikçiler için komisyon oranı - yüzde olarak)
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);

-- 4. commission_rate için açıklama ekle
COMMENT ON COLUMN app_users.commission_rate IS 'Emlakçı/Aracı/Tedarikçi komisyon oranı (yüzde olarak, örn: 10.00 = %10)';

-- Artık emlakçı, aracı ve tedarikçi kullanıcıları için komisyon oranı tanımlanabilir ve 'realtor' rolü kullanılabilir.
-- commission_rate NULL ise emlakçı/aracı/tedarikçi değildir veya komisyon tanımlanmamıştır.

