import { useI18n } from '../hooks/useI18n';
import { APP_VERSION } from '../version';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p
          className="footer-note"
          dangerouslySetInnerHTML={{ __html: t('footer.note') }}
        />
        <p className="footer-note">
          <span>{t('footer.copy')}</span>
          &ensp;·&ensp;
          <span className="footer-version">
            {t('footer.version')} <span id="appVersion">{APP_VERSION}</span>
          </span>
        </p>
      </div>
    </footer>
  );
}
