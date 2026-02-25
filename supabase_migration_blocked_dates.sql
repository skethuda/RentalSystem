-- Villaların belirli tarih aralıklarını satışa kapatmak için blocked_dates tablosu
-- Bu SQL komutlarını Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. blocked_dates tablosu oluştur
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tarih aralığı için geçerlilik kontrolü
ALTER TABLE blocked_dates
  ADD CONSTRAINT blocked_dates_start_before_end
  CHECK (start_date < end_date);

-- 3. Sorgu performansı için index
CREATE INDEX IF NOT EXISTS blocked_dates_property_date_idx
  ON blocked_dates (property_id, start_date, end_date);

