-- Cari hesap bakiyelerini ledger_transactions toplamına göre düzeltir.
-- Rezervasyon/komisyon silindiğinde işlemler silinip bakiyeler güncellenmediyse bu scripti çalıştırın.
-- Supabase Dashboard > SQL Editor'de çalıştırın.

UPDATE ledger_accounts la
SET balance = COALESCE(
  (SELECT SUM(amount) FROM ledger_transactions WHERE account_id = la.id),
  0
);
