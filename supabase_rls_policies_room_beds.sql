-- room_beds tablosu için RLS politikaları
-- Bu SQL komutlarını Supabase Dashboard > SQL Editor'de çalıştırın

-- RLS'yi etkinleştir
ALTER TABLE room_beds ENABLE ROW LEVEL SECURITY;

-- Anon rolü için SELECT politikası
CREATE POLICY "Allow anon select room_beds" ON room_beds
FOR SELECT
TO anon
USING (true);

-- Anon rolü için INSERT politikası
CREATE POLICY "Allow anon insert room_beds" ON room_beds
FOR INSERT
TO anon
WITH CHECK (true);

-- Anon rolü için UPDATE politikası
CREATE POLICY "Allow anon update room_beds" ON room_beds
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Anon rolü için DELETE politikası
CREATE POLICY "Allow anon delete room_beds" ON room_beds
FOR DELETE
TO anon
USING (true);

-- Not: Eğer authenticated rolü için de gerekirse, aşağıdaki politikaları da ekleyebilirsiniz:
-- CREATE POLICY "Allow authenticated select room_beds" ON room_beds
-- FOR SELECT
-- TO authenticated
-- USING (true);
--
-- CREATE POLICY "Allow authenticated insert room_beds" ON room_beds
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);
--
-- CREATE POLICY "Allow authenticated update room_beds" ON room_beds
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
--
-- CREATE POLICY "Allow authenticated delete room_beds" ON room_beds
-- FOR DELETE
-- TO authenticated
-- USING (true);

