import { dbQuery, Property, AppUser, Booking, LedgerAccount, LedgerTransaction } from './supabase';

/**
 * Cari hesap oluştur veya getir
 */
export async function getOrCreateLedgerAccount(
  userId: string | null,
  userRole: 'supplier' | 'agent' | 'realtor' | 'company'
): Promise<LedgerAccount> {
  try {
    // Firma cari hesabı için özel kontrol (user_id null, user_role 'company')
    if (userRole === 'company') {
      // Tüm company hesaplarını al ve null user_id olanı bul
      const { data: allCompanyAccounts, error: findError } = await dbQuery('ledger_accounts')
        .select('*')
        .eq('user_role', 'company')
        .execute();

      if (findError) {
        console.error('Firma cari hesabı aranırken hata:', findError);
      }

      // user_id null olan firma cari hesabını bul
      const existingAccount = (allCompanyAccounts || []).find((acc: LedgerAccount) => acc.user_id === null);

      if (existingAccount) {
        return existingAccount;
      }

      // Yeni firma cari hesabı oluştur
      const { data: newAccount, error: createError } = await dbQuery('ledger_accounts')
        .insert({
          user_id: null,
          user_role: 'company',
          balance: 0
        });

      if (createError) throw createError;

      // newAccount array veya tek obje olabilir
      return Array.isArray(newAccount) ? newAccount[0] : newAccount;
    }

    // Diğer roller için (user_id gerekli)
    if (!userId) {
      throw new Error('user_id gerekli (firma cari hesabı hariç)');
    }

    // Mevcut cari hesabı kontrol et
    const { data: existingAccount, error: findError } = await dbQuery('ledger_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('user_role', userRole)
      .single()
      .execute();

    if (existingAccount && !findError) {
      return existingAccount;
    }

    // Yeni cari hesap oluştur
    const { data: newAccount, error: createError } = await dbQuery('ledger_accounts')
      .insert({
        user_id: userId,
        user_role: userRole,
        balance: 0
      });

    if (createError) throw createError;

    // newAccount array veya tek obje olabilir
    return Array.isArray(newAccount) ? newAccount[0] : newAccount;
  } catch (error) {
    console.error('Cari hesap oluşturulurken hata:', error);
    throw error;
  }
}

/**
 * Cari işlem ekle
 */
export async function addLedgerTransaction(
  accountId: string,
  bookingId: string | undefined,
  transactionType: 'commission' | 'payment' | 'adjustment',
  amount: number,
  description?: string,
  commissionRate?: number,
  commissionBase?: number
): Promise<void> {
  try {
    const { error } = await dbQuery('ledger_transactions')
      .insert({
        account_id: accountId,
        booking_id: bookingId,
        transaction_type: transactionType,
        amount: amount,
        description: description,
        commission_rate: commissionRate,
        commission_base: commissionBase
      });

    if (error) throw error;

    // Cari hesap bakiyesini güncelle
    const { data: account, error: accountError } = await dbQuery('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single()
      .execute();

    if (accountError) throw accountError;

    const newBalance = (Number(account.balance) || 0) + amount;

    const { error: updateError } = await dbQuery('ledger_accounts')
      .eq('id', accountId)
      .update({ balance: newBalance });

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Cari işlem eklenirken hata:', error);
    throw error;
  }
}

/**
 * Rezervasyon için komisyon hesapla ve cari hesaplara ekle
 */
export async function calculateAndAddCommissions(booking: Booking, property: Property): Promise<void> {
  try {
    console.log('Komisyon hesaplama başladı:', { bookingId: booking.id, propertyId: property.id, totalAmount: booking.total_amount });
    
    // Depozito ve temizlik ücretini çıkartarak komisyon hesaplaması için base amount hesapla
    const cleaningFee = property.cleaning_fee || 0;
    const deposit = property.deposit || 0;
    const totalAmount = booking.total_amount || 0;
    const commissionBaseAmount = totalAmount - cleaningFee - deposit; // Komisyon hesaplaması için base tutar
    
    console.log('Komisyon hesaplama detayları:', { 
      totalAmount, 
      cleaningFee, 
      deposit, 
      commissionBaseAmount 
    });
    
    let remainingAmount = commissionBaseAmount;
    let remainingAfterSupplier = commissionBaseAmount; // Emlakçı komisyonu için (sadece tedarikçi komisyonu çıktıktan sonra)
    let hasSupplier = false;
    let realtorCommissionAmount = 0; // Emlakçı komisyonu tutarı (firma geliri hesaplamak için)

    // 1. Tedarikçi komisyonu (eğer property tedarikçiye aitse)
    if (property.supplier_id) {
      const { data: supplierUser, error: supplierError } = await dbQuery('app_users')
        .select('*')
        .eq('id', property.supplier_id)
        .single()
        .execute();

      if (!supplierError && supplierUser) {
        // Eğer kullanıcı tedarikçi ise
        if (supplierUser.role === 'supplier' && supplierUser.commission_rate) {
          const commissionRate = supplierUser.commission_rate;
          const commissionAmount = (commissionBaseAmount * commissionRate) / 100;

          console.log('Tedarikçi komisyonu hesaplanıyor:', { supplierId: property.supplier_id, rate: commissionRate, amount: commissionAmount, baseAmount: commissionBaseAmount });

          // Tedarikçi cari hesabını oluştur veya getir
          const supplierAccount = await getOrCreateLedgerAccount(property.supplier_id, 'supplier');

          // Cari işlem ekle
          await addLedgerTransaction(
            supplierAccount.id!,
            booking.id,
            'commission',
            commissionAmount,
            `Rezervasyon komisyonu - ${property.title}`,
            commissionRate,
            commissionBaseAmount
          );

          remainingAmount = commissionBaseAmount - commissionAmount;
          remainingAfterSupplier = commissionBaseAmount - commissionAmount; // Emlakçı için kalan tutar
          hasSupplier = true;
          console.log('Tedarikçi komisyonu eklendi:', { accountId: supplierAccount.id, amount: commissionAmount, remainingAfterSupplier });
        }
      }
    }

    // 2. Aracı komisyonu (sistemdeki aktif aracı)
    // Her rezervasyonda aracı komisyonu hesaplanır
    // Eğer property tedarikçiye aitse kalan tutar üzerinden, değilse komisyon base tutar üzerinden
    const { data: agents, error: agentsError } = await dbQuery('app_users')
      .select('*')
      .eq('role', 'agent')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .execute();

    if (agentsError) {
      console.error('Aracılar yüklenirken hata:', agentsError);
    }

    if (!agentsError && agents && agents.length > 0) {
      const agent = agents[0];
      console.log('Aracı bulundu:', { agentId: agent.id, commissionRate: agent.commission_rate, hasSupplier });
      
      if (agent.commission_rate && agent.commission_rate > 0) {
        const commissionRate = agent.commission_rate;
        // Property tedarikçiye aitse kalan tutar, değilse komisyon base tutar üzerinden
        const baseAmount = hasSupplier ? remainingAmount : commissionBaseAmount;
        const commissionAmount = (baseAmount * commissionRate) / 100;

        console.log('Aracı komisyonu hesaplanıyor:', { agentId: agent.id, rate: commissionRate, baseAmount, amount: commissionAmount });

        if (commissionAmount > 0) {
          // Aracı cari hesabını oluştur veya getir
          const agentAccount = await getOrCreateLedgerAccount(agent.id, 'agent');

          // Cari işlem ekle
          await addLedgerTransaction(
            agentAccount.id!,
            booking.id,
            'commission',
            commissionAmount,
            `Rezervasyon komisyonu - ${property.title}`,
            commissionRate,
            baseAmount
          );

          // Kalan tutarı güncelle
          remainingAmount = baseAmount - commissionAmount;
          console.log('Aracı komisyonu eklendi:', { accountId: agentAccount.id, amount: commissionAmount, remainingAmount });
        } else {
          console.log('Aracı komisyon tutarı 0, işlem eklenmedi');
        }
      } else {
        console.log('Aracı komisyon oranı tanımlı değil veya 0:', { agentId: agent.id, commissionRate: agent.commission_rate });
      }
    } else {
      console.log('Aktif aracı bulunamadı', { agentsError, agentsCount: agents?.length || 0 });
    }

    // 3. Emlakçı komisyonu (eğer rezervasyon emlakçıdan geldiyse)
    // Emlakçı komisyonu sadece tedarikçi komisyonu çıktıktan sonra kalan tutar üzerinden hesaplanır (aracı komisyonu düşülmez)
    console.log('Emlakçı kontrolü:', { source: booking.source, realtorId: booking.realtor_id, remainingAfterSupplier });
    
    if (booking.source === 'realtor' && booking.realtor_id) {
      console.log('Emlakçı komisyonu hesaplanacak, emlakçı ID:', booking.realtor_id);
      
      const { data: realtor, error: realtorError } = await dbQuery('app_users')
        .select('*')
        .eq('id', booking.realtor_id)
        .single()
        .execute();

      if (realtorError) {
        console.error('Emlakçı yüklenirken hata:', realtorError);
      }

      if (!realtorError && realtor) {
        console.log('Emlakçı bulundu:', { realtorId: realtor.id, commissionRate: realtor.commission_rate, role: realtor.role });
        
        if (realtor.commission_rate && realtor.commission_rate > 0) {
          const commissionRate = realtor.commission_rate;
          // Emlakçı komisyonu sadece tedarikçi komisyonu çıktıktan sonra kalan tutar üzerinden hesaplanır
          realtorCommissionAmount = (remainingAfterSupplier * commissionRate) / 100;

          console.log('Emlakçı komisyonu hesaplanıyor:', { realtorId: booking.realtor_id, rate: commissionRate, remainingAfterSupplier, amount: realtorCommissionAmount });

          if (realtorCommissionAmount > 0) {
            // Emlakçı cari hesabını oluştur veya getir
            const realtorAccount = await getOrCreateLedgerAccount(booking.realtor_id, 'realtor');

            // Cari işlem ekle
            await addLedgerTransaction(
              realtorAccount.id!,
              booking.id,
              'commission',
              realtorCommissionAmount,
              `Rezervasyon komisyonu - ${property.title}`,
              commissionRate,
              remainingAfterSupplier
            );

            console.log('Emlakçı komisyonu eklendi:', { accountId: realtorAccount.id, amount: realtorCommissionAmount });
          } else {
            console.log('Emlakçı komisyon tutarı 0, işlem eklenmedi');
          }
        } else {
          console.log('Emlakçı komisyon oranı tanımlı değil veya 0:', { realtorId: booking.realtor_id, commissionRate: realtor.commission_rate });
        }
      } else {
        console.log('Emlakçı bulunamadı:', { realtorId: booking.realtor_id, error: realtorError });
      }
    } else {
      console.log('Rezervasyon emlakçıdan gelmedi:', { source: booking.source, realtorId: booking.realtor_id });
    }

    // 4. Firma geliri (kalan tutar - tüm komisyonlar çıktıktan sonra)
    // remainingAmount: tedarikçi ve aracı komisyonları çıktıktan sonra kalan tutar
    // realtorCommissionAmount: emlakçı komisyonu (zaten hesaplanmış)
    // Firma geliri = remainingAmount - emlakçı komisyonu (eğer varsa)
    const companyRevenue = remainingAmount - realtorCommissionAmount;

    console.log('Firma geliri hesaplanıyor:', { commissionBaseAmount, remainingAmount, companyRevenue });

    // Firma cari hesabını oluştur veya getir
    const companyAccount = await getOrCreateLedgerAccount(null, 'company');

    // 4a. Rezervasyon gelirini (komisyonlar çıktıktan sonra kalan) firma hesabına ekle
    if (companyRevenue > 0) {
      await addLedgerTransaction(
        companyAccount.id!,
        booking.id,
        'commission', // transaction_type olarak 'commission' kullanıyoruz, ama aslında firma geliri
        companyRevenue,
        `Rezervasyon geliri - ${property.title}`,
        undefined, // commission_rate yok
        commissionBaseAmount // commission_base olarak komisyon base tutar
      );

      console.log('Firma geliri eklendi:', { accountId: companyAccount.id, amount: companyRevenue });
    } else {
      console.log('Firma geliri 0 veya negatif, işlem eklenmedi:', { companyRevenue });
    }

    // 4b. Temizlik ücretini firma gelir hesabına ekle
    if (cleaningFee > 0) {
      await addLedgerTransaction(
        companyAccount.id!,
        booking.id,
        'commission',
        cleaningFee,
        `Temizlik ücreti - ${property.title}`,
        undefined,
        cleaningFee
      );

      console.log('Temizlik ücreti firma hesabına eklendi:', { accountId: companyAccount.id, amount: cleaningFee });
    }

    console.log('Komisyon hesaplama tamamlandı');
  } catch (error) {
    console.error('Komisyon hesaplanırken hata:', error);
    throw error;
  }
}

