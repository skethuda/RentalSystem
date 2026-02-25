-- blocked_dates tablosu için RLS politikaları
-- Bu SQL komutlarını Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. RLS aktif et
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- 2. Eğer varsa eski politikaları temizle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blocked_dates'
  ) THEN
    DELETE FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blocked_dates';
  END IF;
END $$;

-- 3. anon rolü için tüm işlemlere izin ver (uygulama zaten kendi access kontrolünü yapıyor)
CREATE POLICY "Allow select for anon"
  ON blocked_dates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert for anon"
  ON blocked_dates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update for anon"
  ON blocked_dates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for anon"
  ON blocked_dates
  FOR DELETE
  TO anon
  USING (true);

