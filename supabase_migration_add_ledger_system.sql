-- Supabase'de cari hesap sistemi için tablolar oluşturmak
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Cari Hesaplar Tablosu
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('supplier', 'agent', 'realtor')),
  balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, user_role)
);

-- 2. Cari İşlemler Tablosu
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('commission', 'payment', 'adjustment')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  commission_rate DECIMAL(5,2), -- Komisyon oranı (yüzde)
  commission_base DECIMAL(12,2), -- Komisyon hesaplanan tutar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- 3. İndeksler
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_user_id ON ledger_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_user_role ON ledger_accounts(user_role);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_account_id ON ledger_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_booking_id ON ledger_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_created_at ON ledger_transactions(created_at);

-- 4. Cari hesap bakiyesini otomatik güncelleyen trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_ledger_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ledger_accounts
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ledger_accounts
    SET balance = balance - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger oluştur
DROP TRIGGER IF EXISTS trigger_update_ledger_account_balance ON ledger_transactions;
CREATE TRIGGER trigger_update_ledger_account_balance
  AFTER INSERT OR DELETE ON ledger_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_ledger_account_balance();

-- 6. Kolonlar için açıklamalar
COMMENT ON TABLE ledger_accounts IS 'Cari hesaplar - Tedarikçi, Aracı ve Emlakçılar için';
COMMENT ON TABLE ledger_transactions IS 'Cari işlemler - Komisyon ödemeleri ve diğer işlemler';
COMMENT ON COLUMN ledger_accounts.user_role IS 'Kullanıcı rolü: supplier, agent, realtor';
COMMENT ON COLUMN ledger_transactions.transaction_type IS 'İşlem tipi: commission (komisyon), payment (ödeme), adjustment (düzeltme)';
COMMENT ON COLUMN ledger_transactions.commission_rate IS 'Komisyon oranı (yüzde olarak)';
COMMENT ON COLUMN ledger_transactions.commission_base IS 'Komisyon hesaplanan tutar (komisyon oranı uygulanan tutar)';

-- Artık cari hesap sistemi kullanıma hazır!

