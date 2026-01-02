import { useEffect, useState } from 'react';
import { dbQuery, Expense, Property, LedgerAccount, LedgerTransaction, AppUser } from '../../../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface ExpenseWithProperty extends Expense {
  property?: Property;
}

type ExpenseType = 'electricity' | 'water' | 'maintenance' | 'cleaning' | 'other';

const EXPENSE_TYPES: { value: ExpenseType; label: string; icon: string }[] = [
  { value: 'electricity', label: 'Elektrik Faturası', icon: 'ri-flashlight-line' },
  { value: 'water', label: 'Su Faturası', icon: 'ri-water-percent-line' },
  { value: 'maintenance', label: 'Bakım/Onarım', icon: 'ri-tools-line' },
  { value: 'cleaning', label: 'Temizlik', icon: 'ri-broom-line' },
  { value: 'other', label: 'Diğer', icon: 'ri-file-list-line' },
];

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<ExpenseWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Cari hesaplar için state
  const [ledgerAccounts, setLedgerAccounts] = useState<(LedgerAccount & { user?: AppUser; totalPaid?: number; totalCommission?: number })[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<(LedgerTransaction & { account?: LedgerAccount & { user?: AppUser } })[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerFilterRole, setLedgerFilterRole] = useState<'all' | 'supplier' | 'agent' | 'realtor' | 'company'>('all');
  const [ledgerFilterSearch, setLedgerFilterSearch] = useState('');
  
  // Ödeme için state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState<LedgerAccount & { user?: AppUser } | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    description: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    property_id: '' as string | null,
    expense_type: 'electricity' as ExpenseType,
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    due_date: '',
    is_paid: false,
    paid_date: '',
    invoice_number: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
    loadLedgerAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadLedgerTransactions(selectedAccountId);
    }
  }, [selectedAccountId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Properties yükle
      const propertiesResult = await dbQuery('properties')
        .select('*')
        .order('title', { ascending: true })
        .execute();
      
      if (propertiesResult.error) {
        console.error('Properties yüklenirken hata:', propertiesResult.error);
      } else {
        setProperties(propertiesResult.data || []);
      }

      // Expenses yükle
      await loadExpenses();
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const expensesResult = await dbQuery('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .execute();

      if (expensesResult.error && !expensesResult.data) {
        console.error('Harcamalar yüklenirken hata:', expensesResult.error);
        return;
      }

      const expensesData = expensesResult.data || [];

      // Her expense için property bilgisini al
      const expensesWithProperties = await Promise.all(
        expensesData.map(async (expense: Expense) => {
          // property_id null ise "Diğer" harcaması
          if (!expense.property_id) {
            return {
              ...expense,
              property: null
            };
          }
          
          try {
            const propertyResult = await dbQuery('properties')
              .select('*')
              .eq('id', expense.property_id)
              .single()
              .execute();
            
            return {
              ...expense,
              property: propertyResult.error ? null : propertyResult.data
            };
          } catch (error) {
            console.error('Property yüklenirken hata:', error);
            return {
              ...expense,
              property: null
            };
          }
        })
      );

      setExpenses(expensesWithProperties);
    } catch (error) {
      console.error('Harcamalar yüklenirken hata:', error);
    }
  };

  const loadLedgerAccounts = async () => {
    try {
      const { data: accounts, error } = await dbQuery('ledger_accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;

      // Her cari hesap için kullanıcı bilgisini, toplam ödenen ve toplam komisyon tutarını al
      const accountsWithUsers = await Promise.all(
        (accounts || []).map(async (account: LedgerAccount) => {
          // Toplam ödenen tutarı hesapla (payment tipindeki işlemlerin toplamı)
          let totalPaid = 0;
          try {
            const { data: paymentTransactions } = await dbQuery('ledger_transactions')
              .select('*')
              .eq('account_id', account.id)
              .eq('transaction_type', 'payment')
              .execute();

            if (paymentTransactions) {
              totalPaid = paymentTransactions.reduce((sum: number, transaction: LedgerTransaction) => {
                // Payment işlemleri negatif tutar olarak kaydedilir, mutlak değerini al
                return sum + Math.abs(Number(transaction.amount) || 0);
              }, 0);
            }
          } catch (error) {
            console.error('Ödeme toplamı hesaplanırken hata:', error);
          }

          // Toplam komisyon tutarını hesapla (commission tipindeki işlemlerin toplamı)
          let totalCommission = 0;
          try {
            const { data: commissionTransactions } = await dbQuery('ledger_transactions')
              .select('*')
              .eq('account_id', account.id)
              .eq('transaction_type', 'commission')
              .execute();

            if (commissionTransactions) {
              totalCommission = commissionTransactions.reduce((sum: number, transaction: LedgerTransaction) => {
                // Commission işlemleri pozitif tutar olarak kaydedilir
                return sum + (Number(transaction.amount) || 0);
              }, 0);
            }
          } catch (error) {
            console.error('Komisyon toplamı hesaplanırken hata:', error);
          }

          // Firma cari hesabı için user bilgisi yok
          if (account.user_role === 'company' || !account.user_id) {
            return {
              ...account,
              user: null,
              totalPaid,
              totalCommission
            };
          }

          try {
            const { data: userData } = await dbQuery('app_users')
              .select('*')
              .eq('id', account.user_id)
              .single()
              .execute();

            return {
              ...account,
              user: userData,
              totalPaid,
              totalCommission
            };
          } catch (error) {
            return {
              ...account,
              user: null,
              totalPaid,
              totalCommission
            };
          }
        })
      );

      setLedgerAccounts(accountsWithUsers);
    } catch (error) {
      console.error('Cari hesaplar yüklenirken hata:', error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAccount?.id) return;

    setProcessingPayment(true);
    try {
      const amount = parseFloat(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Lütfen geçerli bir tutar giriniz.');
        setProcessingPayment(false);
        return;
      }

      // Ödeme işlemini ekle (negatif tutar - bakiye azalır)
      const { error } = await dbQuery('ledger_transactions')
        .insert({
          account_id: paymentAccount.id,
          transaction_type: 'payment',
          amount: -amount, // Negatif tutar - ödeme yapıldığında bakiye azalır
          description: paymentData.description || `Ödeme - ${paymentData.payment_date}`,
        });

      if (error) throw error;

      alert('Ödeme başarıyla kaydedildi!');
      setShowPaymentModal(false);
      setPaymentAccount(null);
      setPaymentData({
        amount: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
      });

      // Cari hesapları ve işlemleri yenile
      await loadLedgerAccounts();
      if (selectedAccountId === paymentAccount.id) {
        await loadLedgerTransactions(paymentAccount.id);
      }
    } catch (error: any) {
      console.error('Ödeme kaydedilirken hata:', error);
      alert('Ödeme kaydedilirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const loadLedgerTransactions = async (accountId: string) => {
    try {
      const { data: transactions, error } = await dbQuery('ledger_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .execute();

      if (error) throw error;

      // Her işlem için cari hesap ve kullanıcı bilgisini al
      const transactionsWithDetails = await Promise.all(
        (transactions || []).map(async (transaction: LedgerTransaction) => {
          try {
            const { data: accountData } = await dbQuery('ledger_accounts')
              .select('*')
              .eq('id', transaction.account_id)
              .single()
              .execute();

            if (accountData) {
              // Firma cari hesabı için user bilgisi yok
              let userData = null;
              if (accountData.user_role !== 'company' && accountData.user_id) {
                const { data: user } = await dbQuery('app_users')
                  .select('*')
                  .eq('id', accountData.user_id)
                  .single()
                  .execute();
                userData = user;
              }

              return {
                ...transaction,
                account: {
                  ...accountData,
                  user: userData
                }
              };
            }

            return {
              ...transaction,
              account: null
            };
          } catch (error) {
            return {
              ...transaction,
              account: null
            };
          }
        })
      );

      setLedgerTransactions(transactionsWithDetails);
    } catch (error) {
      console.error('Cari işlemler yüklenirken hata:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...formData,
        property_id: formData.property_id || null,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        due_date: formData.due_date || null,
        paid_date: formData.is_paid && formData.paid_date ? formData.paid_date : null,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null,
      };

      let result;
      if (editingExpense?.id) {
        // Güncelle
        result = await dbQuery('expenses')
          .eq('id', editingExpense.id)
          .update(expenseData);
      } else {
        // Yeni ekle
        result = await dbQuery('expenses')
          .insert(expenseData);
      }

      // Sadece gerçek hata varsa hata mesajı göster
      if (result.error && !result.data) {
        console.error('Harcama kaydedilirken hata:', result.error);
        alert('Harcama kaydedilirken bir hata oluştu: ' + (result.error.message || 'Bilinmeyen hata'));
        return;
      }

      await loadExpenses();
      handleCloseModal();
    } catch (error: any) {
      console.error('Harcama kaydedilirken hata:', error);
      alert('Harcama kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleEdit = (expense: ExpenseWithProperty) => {
    setEditingExpense(expense);
    setFormData({
      property_id: expense.property_id || '',
      expense_type: expense.expense_type,
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date.split('T')[0],
      due_date: expense.due_date ? expense.due_date.split('T')[0] : '',
      is_paid: expense.is_paid,
      paid_date: expense.paid_date ? expense.paid_date.split('T')[0] : '',
      invoice_number: expense.invoice_number || '',
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu harcamayı silmek istediğinize emin misiniz?')) return;

    try {
      const result = await dbQuery('expenses')
        .eq('id', id)
        .delete();

      // Sadece gerçek hata varsa hata mesajı göster
      if (result.error && !result.data) {
        console.error('Harcama silinirken hata:', result.error);
        alert('Harcama silinirken bir hata oluştu: ' + (result.error.message || 'Bilinmeyen hata'));
        return;
      }

      await loadExpenses();
    } catch (error: any) {
      console.error('Harcama silinirken hata:', error);
      alert('Harcama silinirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      property_id: null,
      expense_type: 'electricity',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      due_date: '',
      is_paid: false,
      paid_date: '',
      invoice_number: '',
      notes: '',
    });
  };

  const handleMarkAsPaid = async (expense: ExpenseWithProperty) => {
    try {
      const result = await dbQuery('expenses')
        .eq('id', expense.id)
        .update({
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
        });

      // Sadece gerçek hata varsa hata mesajı göster
      if (result.error && !result.data) {
        console.error('Harcama güncellenirken hata:', result.error);
        alert('Harcama güncellenirken bir hata oluştu: ' + (result.error.message || 'Bilinmeyen hata'));
        return;
      }

      await loadExpenses();
    } catch (error: any) {
      console.error('Harcama güncellenirken hata:', error);
      alert('Harcama güncellenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Filtreleme
  const filteredExpenses = expenses.filter(expense => {
    if (filterType !== 'all' && expense.expense_type !== filterType) return false;
    if (filterProperty !== 'all') {
      if (filterProperty === 'other' && expense.property_id !== null) return false;
      if (filterProperty !== 'other' && expense.property_id !== filterProperty) return false;
    }
    if (filterPaid === 'paid' && !expense.is_paid) return false;
    if (filterPaid === 'unpaid' && expense.is_paid) return false;
    if (dateRange.start && expense.expense_date < dateRange.start) return false;
    if (dateRange.end && expense.expense_date > dateRange.end) return false;
    return true;
  });

  // Raporlama
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = filteredExpenses.filter(e => e.is_paid).reduce((sum, e) => sum + e.amount, 0);
  const unpaidExpenses = filteredExpenses.filter(e => !e.is_paid).reduce((sum, e) => sum + e.amount, 0);

  const expensesByType = EXPENSE_TYPES.map(type => ({
    type: type.label,
    amount: filteredExpenses
      .filter(e => e.expense_type === type.value)
      .reduce((sum, e) => sum + e.amount, 0),
    count: filteredExpenses.filter(e => e.expense_type === type.value).length,
  }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Muhasebe & Harcama Yönetimi</h1>
            <p className="text-gray-600 mt-1">Villa, daire ve firma harcamalarını yönetin ve rapor alın</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
          >
            <i className="ri-add-line"></i>
            Yeni Harcama Ekle
          </button>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Harcama</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₺{totalExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ödenen</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₺{paidExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ödenmemiş</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  ₺{unpaidExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-red-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Kayıt</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredExpenses.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Harcama Türü</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ExpenseType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                <option value="all">Tümü</option>
                {EXPENSE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Villa</label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="other">Diğer (Firma Harcamaları)</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Durumu</label>
              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value as 'all' | 'paid' | 'unpaid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="paid">Ödenen</option>
                <option value="unpaid">Ödenmemiş</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Harcama Listesi */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Villa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Harcama kaydı bulunamadı
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                    const expenseType = EXPENSE_TYPES.find(t => t.value === expense.expense_type);
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.property_id ? (expense.property?.title || 'Bilinmeyen') : 'Diğer (Firma Harcaması)'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <i className={expenseType?.icon || 'ri-file-line'}></i>
                            <span className="text-sm text-gray-900">{expenseType?.label || expense.expense_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expense.is_paid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <i className="ri-checkbox-circle-line mr-1"></i>
                              Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <i className="ri-close-circle-line mr-1"></i>
                              Ödenmedi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {!expense.is_paid && (
                              <button
                                onClick={() => handleMarkAsPaid(expense)}
                                className="text-green-600 hover:text-green-900"
                                title="Ödendi olarak işaretle"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <i className="ri-pencil-line"></i>
                            </button>
                            <button
                              onClick={() => expense.id && handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rapor Bölümü */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Harcama Raporu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Harcama Türüne Göre</h3>
              <div className="space-y-2">
                {expensesByType.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.type}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ₺{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">({item.count} kayıt)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Villaya Göre</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Diğer (Firma Harcamaları) */}
                {(() => {
                  const otherExpenses = filteredExpenses.filter(e => e.property_id === null);
                  const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
                  if (otherExpenses.length > 0) {
                    return (
                      <div key="other" className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 truncate">Diğer (Firma Harcamaları)</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ₺{otherTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({otherExpenses.length} kayıt)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {properties.map(prop => {
                  const propExpenses = filteredExpenses.filter(e => e.property_id === prop.id);
                  const propTotal = propExpenses.reduce((sum, e) => sum + e.amount, 0);
                  if (propExpenses.length === 0) return null;
                  return (
                    <div key={prop.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{prop.title}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₺{propTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({propExpenses.length} kayıt)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingExpense ? 'Harcama Düzenle' : 'Yeni Harcama Ekle'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Villa</label>
                  <select
                    value={formData.property_id || ''}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    <option value="">Diğer (Firma Harcaması)</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harcama Türü *</label>
                  <select
                    required
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value as ExpenseType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    {EXPENSE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama *</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Örn: Ocak ayı elektrik faturası"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (₺) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fatura Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Son Ödeme Tarihi</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fatura No</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="Fatura numarası"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-gray-700">Ödendi</span>
                  </label>
                </div>

                {formData.is_paid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Tarihi</label>
                    <input
                      type="date"
                      value={formData.paid_date}
                      onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Ek notlar..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8960D] transition-colors"
                  >
                    {editingExpense ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cari Hesaplar Bölümü */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Cari Hesaplar</h2>
            <button
              onClick={() => {
                loadLedgerAccounts();
                setSelectedAccountId(null);
                setLedgerTransactions([]);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Yenile
            </button>
          </div>

          {/* Toplam Ödemeler Özeti */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium mb-1">Toplam Borç (Komisyonlar)</p>
                  <p className="text-2xl font-bold text-red-700">
                    ₺{ledgerAccounts.reduce((sum, account) => sum + (account.totalCommission || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-file-list-3-line text-2xl text-red-600"></i>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Toplam Ödemeler</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ₺{ledgerAccounts.reduce((sum, account) => sum + (account.totalPaid || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-blue-600"></i>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium mb-1">Net Borç</p>
                  <p className="text-2xl font-bold text-orange-700">
                    ₺{(() => {
                      const totalCommission = ledgerAccounts.reduce((sum, account) => sum + (account.totalCommission || 0), 0);
                      const totalPaid = ledgerAccounts.reduce((sum, account) => sum + (account.totalPaid || 0), 0);
                      const netDebt = totalCommission - totalPaid;
                      return Math.abs(netDebt).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
                    (Komisyonlar - Ödemeler)
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-calculator-line text-2xl text-orange-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol Filtresi</label>
              <select
                value={ledgerFilterRole}
                onChange={(e) => setLedgerFilterRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="supplier">Tedarikçi</option>
                <option value="agent">Aracı</option>
                <option value="realtor">Emlakçı</option>
                <option value="company">Firma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
              <input
                type="text"
                value={ledgerFilterSearch}
                onChange={(e) => setLedgerFilterSearch(e.target.value)}
                placeholder="İsim, firma adı ile ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              />
            </div>
          </div>

          {/* Cari Hesaplar Tablosu */}
          <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Firma</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Bakiye</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Toplam Ödenen</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const roleLabels: { [key: string]: string } = {
                      supplier: 'Tedarikçi',
                      agent: 'Aracı',
                      realtor: 'Emlakçı',
                      company: 'Firma'
                    };
                    const roleColors: { [key: string]: string } = {
                      supplier: 'bg-blue-100 text-blue-700',
                      agent: 'bg-purple-100 text-purple-700',
                      realtor: 'bg-orange-100 text-orange-700',
                      company: 'bg-green-100 text-green-700'
                    };

                    // Filtreleme
                    let filteredAccounts = ledgerAccounts;
                    if (ledgerFilterRole !== 'all') {
                      filteredAccounts = filteredAccounts.filter(acc => acc.user_role === ledgerFilterRole);
                    }
                    if (ledgerFilterSearch) {
                      const searchLower = ledgerFilterSearch.toLowerCase();
                      filteredAccounts = filteredAccounts.filter(acc => {
                        // Firma cari hesabı için özel kontrol
                        if (acc.user_role === 'company') {
                          return 'firma'.includes(searchLower) || 'aylin villas'.includes(searchLower);
                        }
                        const userName = acc.user ? `${acc.user.first_name} ${acc.user.last_name}`.toLowerCase() : '';
                        const companyName = acc.user?.company_name?.toLowerCase() || '';
                        return userName.includes(searchLower) || companyName.includes(searchLower);
                      });
                    }

                    if (filteredAccounts.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Cari hesap bulunamadı
                          </td>
                        </tr>
                      );
                    }

                    return filteredAccounts.map((account) => (
                      <tr 
                        key={account.id} 
                        className={`hover:bg-gray-50 transition-colors ${selectedAccountId === account.id ? 'bg-[#FDF8E7]' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {account.user_role === 'company' 
                                  ? 'Aylin Villas' 
                                  : account.user 
                                    ? `${account.user.first_name} ${account.user.last_name}` 
                                    : 'Bilinmeyen'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {account.user_role === 'company' 
                                  ? 'Firma Gelir Hesabı' 
                                  : account.user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[account.user_role] || 'bg-gray-100 text-gray-700'}`}>
                            {roleLabels[account.user_role] || account.user_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {account.user_role === 'company' 
                              ? 'Aylin Villas' 
                              : account.user?.company_name || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <p className={`text-sm font-semibold ${Number(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₺{Number(account.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            ₺{(account.totalPaid || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => {
                                setPaymentAccount(account);
                                setPaymentData({
                                  amount: '',
                                  description: '',
                                  payment_date: new Date().toISOString().split('T')[0],
                                });
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1 rounded text-xs font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200"
                              title="Ödeme Yap"
                            >
                              <i className="ri-money-dollar-circle-line mr-1"></i>
                              Ödeme Yap
                            </button>
                            <button
                              onClick={() => {
                                if (selectedAccountId === account.id) {
                                  setSelectedAccountId(null);
                                  setLedgerTransactions([]);
                                } else {
                                  setSelectedAccountId(account.id || null);
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                selectedAccountId === account.id
                                  ? 'bg-[#D4AF37] text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {selectedAccountId === account.id ? 'İşlemleri Gizle' : 'İşlemleri Göster'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seçili Cari Hesap İşlemleri */}
          {selectedAccountId && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Geçmişi</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Açıklama</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tip</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Komisyon Oranı</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledgerTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Henüz işlem bulunmuyor
                          </td>
                        </tr>
                      ) : (
                        ledgerTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.created_at
                                ? new Date(transaction.created_at).toLocaleDateString('tr-TR')
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{transaction.description || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.transaction_type === 'commission'
                                  ? 'bg-green-100 text-green-700'
                                  : transaction.transaction_type === 'payment'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {transaction.transaction_type === 'commission' ? 'Komisyon' :
                                 transaction.transaction_type === 'payment' ? 'Ödeme' : 'Düzeltme'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.commission_rate ? `%${transaction.commission_rate}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-semibold ${
                                transaction.transaction_type === 'payment'
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}>
                                {transaction.transaction_type === 'payment' ? '-' : '+'}
                                ₺{Math.abs(Number(transaction.amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ödeme Modal */}
      {showPaymentModal && paymentAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Cari Hesap Ödemesi</h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAccount(null);
                    setPaymentData({
                      amount: '',
                      description: '',
                      payment_date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Cari Hesap</p>
                <p className="font-semibold text-gray-900">
                  {paymentAccount.user_role === 'company' 
                    ? 'Aylin Villas' 
                    : paymentAccount.user 
                      ? `${paymentAccount.user.first_name} ${paymentAccount.user.last_name}`
                      : 'Bilinmeyen'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {paymentAccount.user_role === 'company' 
                    ? 'Firma Gelir Hesabı' 
                    : paymentAccount.user?.email || ''}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Mevcut Bakiye</p>
                  <p className={`text-lg font-bold ${Number(paymentAccount.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{Number(paymentAccount.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Tutarı (₺) *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Ödeme açıklaması (opsiyonel)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAccount(null);
                    setPaymentData({
                      amount: '',
                      description: '',
                      payment_date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={processingPayment}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processingPayment ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

