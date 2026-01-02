-- Firma cari hesabı için migration
-- user_id'yi nullable yap ve user_role'a 'company' ekle

-- 1. user_id'yi nullable yap
ALTER TABLE ledger_accounts 
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. user_role check constraint'ini güncelle - 'company' ekle
ALTER TABLE ledger_accounts 
  DROP CONSTRAINT IF EXISTS ledger_accounts_user_role_check;

ALTER TABLE ledger_accounts 
  ADD CONSTRAINT ledger_accounts_user_role_check 
  CHECK (user_role IN ('supplier', 'agent', 'realtor', 'company'));

-- 3. UNIQUE constraint'i güncelle - firma için user_id null olabilir
ALTER TABLE ledger_accounts 
  DROP CONSTRAINT IF EXISTS ledger_accounts_user_id_user_role_key;

-- Firma için sadece bir tane cari hesap olabilir (user_id null, user_role 'company')
-- Diğer roller için user_id + user_role unique olmalı
CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_unique_company 
  ON ledger_accounts (user_role) 
  WHERE user_role = 'company' AND user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_unique_user_role 
  ON ledger_accounts (user_id, user_role) 
  WHERE user_id IS NOT NULL;

-- 4. Açıklamaları güncelle
COMMENT ON COLUMN ledger_accounts.user_role IS 'Kullanıcı rolü: supplier, agent, realtor, company';
COMMENT ON COLUMN ledger_accounts.user_id IS 'Kullanıcı ID (firma için null)';

