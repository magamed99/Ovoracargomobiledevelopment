import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, LangCode, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = localStorage.getItem('language') as LangCode;
    return saved && ['ru', 'tj', 'en'].includes(saved) ? saved : 'ru';
  });

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[lang] as Record<string, string>)[key] ?? (translations.ru as Record<string, string>)[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const defaultLanguageContext: LanguageContextType = {
  lang: 'ru',
  setLang: () => {},
  t: (key: TranslationKey): string =>
    (translations.ru as Record<string, string>)[key] ?? key,
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context ?? defaultLanguageContext;
}