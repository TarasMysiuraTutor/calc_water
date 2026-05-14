import { useContext } from 'react';
import { I18nContext } from '../context/i18n-context';
import { t } from '../utils/i18n';

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  const { lang, setLang } = context;
  return {
    lang,
    setLang,
    t: (key, vars) => t(key, lang, vars),
  };
}
