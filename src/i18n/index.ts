import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

// localStorage'dan dil tercihini al
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('i18nextLng');
    if (stored && ['tr', 'en', 'de', 'ru', 'kg'].includes(stored)) {
      return stored;
    }
  }
  return 'tr'; // Varsayılan Türkçe
};

const initialLanguage = getStoredLanguage();

console.log('i18n başlatılıyor...', {
  initialLanguage,
  availableLanguages: Object.keys(messages),
  messagesKeys: Object.keys(messages[initialLanguage]?.translation || {}),
  messagesSample: Object.keys(messages[initialLanguage]?.translation || {}).slice(0, 5)
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'tr',
    debug: false, // Debug modunu kapat (production için)
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Dil değişikliğini localStorage'a kaydet
i18n.on('languageChanged', (lng) => {
  console.log('Dil değişti:', lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
  }
});

export default i18n;