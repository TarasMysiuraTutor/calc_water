import { useState, useCallback, useEffect } from 'react';
import { I18nContext } from './i18n-context';
import { detectLang, saveLang, t } from '../utils/i18n';

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t('meta.title', lang);
  }, [lang]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    saveLang(newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
