import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './i18n';

const getInitialLanguage = () => {
  try {
    return localStorage.getItem('language') || 'ru';
  } catch {
    return 'ru';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: translations.ru },
      tj: { translation: translations.tj },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;