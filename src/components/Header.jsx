import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const languages = [
    { code: 'uk', label: 'UA' },
    { code: 'en', label: 'EN' },
    { code: 'pl', label: 'PL' },
    { code: 'de', label: 'DE' },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" className="logo">
          <span className="logo-formula">H₂O</span>
          <span className="logo-sub">{t('header.sub')}</span>
        </a>
        <div className="header-right">
          <span className="header-badge">{t('header.badge')}</span>
          
          {/* Theme switcher */}
          <div className="theme-switch" role="group">
            {['light', 'auto', 'dark'].map((thm) => (
              <button
                key={thm}
                className={`theme-btn ${theme === thm ? 'active' : ''}`}
                onClick={() => setTheme(thm)}
                aria-label={thm}
                title={t(`theme.${thm}`)}
              >
                {thm === 'light' && '☀️'}
                {thm === 'auto' && '🔄'}
                {thm === 'dark' && '🌙'}
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div className="lang-switch">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                className={`lang-btn ${lang === code ? 'active' : ''}`}
                onClick={() => setLang(code)}
                data-lang={code}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

