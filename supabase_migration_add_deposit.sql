-- Supabase'de properties tablosuna deposit kolonu eklemek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deposit INTEGER DEFAULT 0;

-- Kolon başarıyla eklendikten sonra admin panelinden depozito tutarını girebilirsiniz.
-- Depozito, rezervasyon sırasında temizlik ücreti ile aynı mantıkta toplam tutara eklenecektir.

