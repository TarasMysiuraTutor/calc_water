import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Water, toCelsius, toMPa } from '../utils/water';

export default function InputCard({ onCalculate }) {
  const { t } = useI18n();
  const [tempInput, setTempInput] = useState('');
  const [pressureInput, setPressureInput] = useState('');
  const [tempUnit, setTempUnit] = useState('C');
  const [pressureUnit, setPressureUnit] = useState('MPa');
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    const raw = parseFloat(tempInput.replace(',', '.'));
    if (isNaN(raw)) {
      setError(t('err.notNumber'));
      return;
    }

    let pRawStr = pressureInput.trim().replace(',', '.');
    let pRaw = pRawStr === '' ? null : parseFloat(pRawStr);
    let pMPa;

    if (pRaw === null) {
      pMPa = Water.P_ATM_MPA;
      pRaw = pMPa;
    } else {
      if (isNaN(pRaw)) {
        setError(t('err.notNumber'));
        return;
      }
      pMPa = toMPa(pRaw, pressureUnit);
      if (pMPa < 0.001 || pMPa > 100) {
        setError(t('err.outOfPressure', { val: pRaw + ' ' + pressureUnit }));
        return;
      }
    }

    const T = toCelsius(raw, tempUnit);

    if (T < -100 || T > 800) {
      const range =
        tempUnit === 'C'
          ? '−100 – 800 °C'
          : tempUnit === 'K'
            ? '173.15 – 1073.15 K'
            : '−148 – 1472 °F';
      setError(t('err.outOfRange', { val: raw, range }));
      return;
    }

    onCalculate({
      T,
      raw,
      pMPa,
      pRaw,
      tempUnit,
      pressureUnit,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="card input-card">
      <div className="input-card-title">{t('input.cardTitle')}</div>

      {/* Temperature input row */}
      <div className="input-row">
        <div>
          <label className="field-label" htmlFor="tempInput">
            {t('input.tempLabel')}
          </label>
          <div className="input-group">
            <input
              id="tempInput"
              type="number"
              className="temp-input"
              placeholder="20"
              step="0.1"
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            />
            <span className="input-unit">
              {tempUnit === 'C' ? '°C' : tempUnit === 'K' ? 'K' : '°F'}
            </span>
          </div>
        </div>

        <div>
          <label className="field-label">{t('input.unitsLabel')}</label>
          <div className="unit-toggle">
            {['C', 'K', 'F'].map((unit) => (
              <button
                key={unit}
                className={`unit-btn ${tempUnit === unit ? 'active' : ''}`}
                onClick={() => setTempUnit(unit)}
                data-unit={unit}
              >
                {unit === 'C' ? '°C' : unit === 'K' ? 'K' : '°F'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pressure input row */}
      <div className="input-row">
        <div>
          <label className="field-label" htmlFor="pressureInput">
            {t('input.pressureLabel')}
          </label>
          <div className="input-group">
            <input
              id="pressureInput"
              type="number"
              className="temp-input"
              placeholder="0.101325"
              step="0.001"
              value={pressureInput}
              onChange={(e) => setPressureInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            />
            <span className="input-unit">{pressureUnit}</span>
          </div>
        </div>

        <div>
          <label className="field-label">&nbsp;</label>
          <div className="unit-toggle">
            {['MPa', 'kPa', 'bar', 'atm'].map((unit) => (
              <button
                key={unit}
                className={`punit-btn ${pressureUnit === unit ? 'active' : ''}`}
                onClick={() => setPressureUnit(unit)}
                data-punit={unit}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">&nbsp;</label>
          <button className="btn-calc" onClick={handleCalculate}>
            {t('input.calcBtn')}
          </button>
        </div>
      </div>

      <p className="range-note" dangerouslySetInnerHTML={{ __html: t('input.rangeNote') }} />

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
