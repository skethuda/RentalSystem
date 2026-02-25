-- seasonal_pricing tablosu için RLS politikaları
-- Bu SQL komutlarını Supabase Dashboard > SQL Editor'de çalıştırın

-- RLS'yi etkinleştir
ALTER TABLE seasonal_pricing ENABLE ROW LEVEL SECURITY;

-- Anon rolü için SELECT politikası
CREATE POLICY "Allow anon select seasonal_pricing" ON seasonal_pricing
FOR SELECT
TO anon
USING (true);

-- Anon rolü için INSERT politikası
CREATE POLICY "Allow anon insert seasonal_pricing" ON seasonal_pricing
FOR INSERT
TO anon
WITH CHECK (true);

-- Anon rolü için UPDATE politikası
CREATE POLICY "Allow anon update seasonal_pricing" ON seasonal_pricing
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Anon rolü için DELETE politikası
CREATE POLICY "Allow anon delete seasonal_pricing" ON seasonal_pricing
FOR DELETE
TO anon
USING (true);

-- Not: Eğer authenticated rolü için de gerekirse, aşağıdaki politikaları da ekleyebilirsiniz:
-- CREATE POLICY "Allow authenticated select seasonal_pricing" ON seasonal_pricing
-- FOR SELECT
-- TO authenticated
-- USING (true);
--
-- CREATE POLICY "Allow authenticated insert seasonal_pricing" ON seasonal_pricing
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);
--
-- CREATE POLICY "Allow authenticated update seasonal_pricing" ON seasonal_pricing
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
--
-- CREATE POLICY "Allow authenticated delete seasonal_pricing" ON seasonal_pricing
-- FOR DELETE
-- TO authenticated
-- USING (true);

