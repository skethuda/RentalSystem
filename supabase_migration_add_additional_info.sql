-- Supabase'de site_settings tablosuna house_rules ve additional_info kolonları eklemek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS house_rules TEXT;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Kolonlar başarıyla eklendikten sonra admin panelinden içerik ekleyebilirsiniz.

