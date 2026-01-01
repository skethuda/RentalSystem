-- properties tablosu için anon rolüne UPDATE izni vermek için
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- Anon rolü için UPDATE politikası
CREATE POLICY "Allow anon update properties" ON properties
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Not: Eğer authenticated rolü için de gerekirse:
-- CREATE POLICY "Allow authenticated update properties" ON properties
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

