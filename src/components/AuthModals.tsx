import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalsProps {
  showLogin: boolean;
  showRegister: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}

export default function AuthModals({
  showLogin,
  showRegister,
  onCloseLogin,
  onCloseRegister,
  onSwitchToRegister,
  onSwitchToLogin
}: AuthModalsProps) {
  const { signIn, signUp } = useAuth();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setLoginError(error.message || 'Giriş yapılırken bir hata oluştu');
      setLoginLoading(false);
    } else {
      onCloseLogin();
      setLoginEmail('');
      setLoginPassword('');
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    // Validasyonlar
    if (regPassword !== regPasswordConfirm) {
      setRegError('Şifreler eşleşmiyor');
      setRegLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Şifre en az 6 karakter olmalıdır');
      setRegLoading(false);
      return;
    }

    const { error } = await signUp(regEmail, regPassword, regFirstName, regLastName, regPhone);

    if (error) {
      setRegError(error.message || 'Kayıt olurken bir hata oluştu');
      setRegLoading(false);
    } else {
      setRegSuccess(true);
      setRegLoading(false);
    }
  };

  const resetLoginForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  const resetRegisterForm = () => {
    setRegEmail('');
    setRegPassword('');
    setRegPasswordConfirm('');
    setRegFirstName('');
    setRegLastName('');
    setRegPhone('');
    setRegError('');
    setRegSuccess(false);
  };

  return (
    <>
      {/* Login Modal */}
      {showLogin && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            onCloseLogin();
            resetLoginForm();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Giriş Yap</h2>
              <button 
                onClick={() => {
                  onCloseLogin();
                  resetLoginForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <i className="ri-error-warning-line mr-2"></i>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                <input 
                  type="email" 
                  placeholder="ornek@email.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#B8960D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Giriş yapılıyor...
                  </span>
                ) : 'Giriş Yap'}
              </button>
              <div className="text-center text-sm text-gray-600">
                Hesabınız yok mu?{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    onCloseLogin();
                    resetLoginForm();
                    onSwitchToRegister();
                  }}
                  className="text-[#D4AF37] font-semibold hover:underline"
                >
                  Kayıt Olun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            onCloseRegister();
            resetRegisterForm();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kayıt Ol</h2>
              <button 
                onClick={() => {
                  onCloseRegister();
                  resetRegisterForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {regSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kayıt Başarılı!</h3>
                <p className="text-gray-600 mb-6">
                  Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirin.
                </p>
                <button
                  onClick={() => {
                    onCloseRegister();
                    resetRegisterForm();
                    onSwitchToLogin();
                  }}
                  className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8960D] transition-colors"
                >
                  Giriş Yap
                </button>
              </div>
            ) : (
              <>
                {regError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <i className="ri-error-warning-line mr-2"></i>
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                      <input 
                        type="text" 
                        placeholder="Adınız" 
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                      <input 
                        type="text" 
                        placeholder="Soyadınız" 
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input 
                      type="email" 
                      placeholder="ornek@email.com" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input 
                      type="tel" 
                      placeholder="+90 5XX XXX XX XX" 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                    <input 
                      type="password" 
                      placeholder="En az 6 karakter" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şifre Tekrar</label>
                    <input 
                      type="password" 
                      placeholder="Şifrenizi tekrar girin" 
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={regLoading}
                    className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#B8960D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                        Kayıt olunuyor...
                      </span>
                    ) : 'Kayıt Ol'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Kayıt olarak{' '}
                    <a href="#" className="text-[#D4AF37] hover:underline">Kullanım Koşulları</a> ve{' '}
                    <a href="#" className="text-[#D4AF37] hover:underline">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
                  </p>

                  <div className="text-center text-sm text-gray-600">
                    Zaten hesabınız var mı?{' '}
                    <button 
                      type="button" 
                      onClick={() => {
                        onCloseRegister();
                        resetRegisterForm();
                        onSwitchToLogin();
                      }}
                      className="text-[#D4AF37] font-semibold hover:underline"
                    >
                      Giriş Yapın
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}



