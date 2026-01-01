-- site_settings tablosu için anon rolüne INSERT ve UPDATE izni vermek için
-- Bu SQL komutlarını Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Anon rolü için INSERT politikası
CREATE POLICY "Allow anon insert" ON site_settings
FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Anon rolü için UPDATE politikası
CREATE POLICY "Allow anon update" ON site_settings
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Not: SELECT politikası zaten var gibi görünüyor ("Allow public read")
-- Eğer yoksa, aşağıdaki komutu da çalıştırın:
-- CREATE POLICY "Allow anon select" ON site_settings
-- FOR SELECT
-- TO anon
-- USING (true);

