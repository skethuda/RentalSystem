-- Supabase'de expenses tablosunda property_id kolonunu nullable yapmak için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- property_id kolonunu nullable yap
ALTER TABLE expenses 
ALTER COLUMN property_id DROP NOT NULL;

-- Artık "Diğer (Firma Harcamaları)" seçeneği ile villa/daire dışındaki harcamalar da kaydedilebilir.
-- property_id NULL olan kayıtlar "Diğer (Firma Harcaması)" olarak gösterilecektir.

