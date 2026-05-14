import { useMemo } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Water, fmt } from '../utils/water';

export default function PropsGrid({ T, pMPa }) {
  const { t } = useI18n();

  const properties = useMemo(() => {
    if (T == null || pMPa == null) return [];

    const ph = Water.phase(T, pMPa);

    if (ph === 'ice') {
      const p = Water.computeIce(T, pMPa);
      return [
        { id: '01', symbol: 'ρ', name: t('prop.density'), value: fmt(p.rho, 2), unit: t('unit.density') },
        { id: '02', symbol: 'cₚ', name: t('prop.cp'), value: fmt(p.cp, 1), unit: t('unit.cp') },
        { id: '03', symbol: 'λ', name: t('prop.lambda'), value: fmt(p.lambda, 3), unit: t('unit.lambda') },
        { id: '04', symbol: 'a', name: t('prop.a'), value: fmt(p.a, 4), unit: t('unit.a') },
        { id: '05', symbol: 'β', name: t('prop.beta'), value: fmt(p.beta, 6), unit: t('unit.beta') },
        { id: '06', symbol: 'c', name: t('prop.sound'), value: fmt(p.sound, 1), unit: t('unit.sound') },
        { id: '07', symbol: 'h', name: t('prop.h'), value: fmt(p.h, 2), unit: t('unit.h') },
        { id: '08', symbol: 'L_sf', name: t('prop.hsf'), value: fmt(p.h_sf, 2), unit: t('unit.hsf') },
      ];
    }

    const p = ph === 'steam' ? Water.computeSteam(T, pMPa) : Water.compute(T, pMPa);

    if (ph === 'steam') {
      return [
        { id: '01', symbol: 'ρ', name: t('prop.density'), value: fmt(p.rho, 4), unit: t('unit.density') },
        { id: '02', symbol: 'v', name: t('prop.v'), value: fmt(p.v, 4), unit: t('unit.v') },
        { id: '03', symbol: 'cₚ', name: t('prop.cp'), value: fmt(p.cp, 1), unit: t('unit.cp') },
        { id: '04', symbol: 'γ', name: t('prop.gamma'), value: fmt(p.gamma, 3), unit: t('unit.gamma') },
        { id: '05', symbol: 'λ', name: t('prop.lambda'), value: fmt(p.lambda, 4), unit: t('unit.lambda') },
        { id: '06', symbol: 'a', name: t('prop.a'), value: fmt(p.a, 4), unit: t('unit.a') },
        { id: '07', symbol: 'μ', name: t('prop.mu'), value: fmt(p.mu, 5), unit: t('unit.mu') },
        { id: '08', symbol: 'ν', name: t('prop.nu'), value: fmt(p.nu, 5), unit: t('unit.nu') },
        { id: '09', symbol: 'Pr', name: t('prop.Pr'), value: fmt(p.Pr, 3), unit: t('unit.Pr') },
        { id: '10', symbol: 'β', name: t('prop.beta'), value: fmt(p.beta, 5), unit: t('unit.beta') },
        { id: '11', symbol: 'c', name: t('prop.sound'), value: fmt(p.sound, 1), unit: t('unit.sound') },
        { id: '12', symbol: 'h', name: t('prop.h'), value: fmt(p.h, 2), unit: t('unit.h') },
        { id: '13', symbol: 'r', name: t('prop.hfg'), value: fmt(p.h_fg, 2), unit: t('unit.hfg') },
      ];
    }

    // Liquid water
    return [
      { id: '01', symbol: 'ρ', name: t('prop.density'), value: fmt(p.rho, 3), unit: t('unit.density') },
      { id: '02', symbol: 'cₚ', name: t('prop.cp'), value: fmt(p.cp, 1), unit: t('unit.cp') },
      { id: '03', symbol: 'λ', name: t('prop.lambda'), value: fmt(p.lambda, 4), unit: t('unit.lambda') },
      { id: '04', symbol: 'a', name: t('prop.a'), value: fmt(p.a, 4), unit: t('unit.a') },
      { id: '05', symbol: 'μ', name: t('prop.mu'), value: fmt(p.mu, 5), unit: t('unit.mu') },
      { id: '06', symbol: 'ν', name: t('prop.nu'), value: fmt(p.nu, 4), unit: t('unit.nu') },
      { id: '07', symbol: 'Pr', name: t('prop.Pr'), value: fmt(p.Pr, 3), unit: t('unit.Pr') },
      { id: '08', symbol: 'σ', name: t('prop.sigma'), value: fmt(p.sigma, 5), unit: t('unit.sigma') },
      { id: '09', symbol: 'β', name: t('prop.beta'), value: fmt(p.beta, 5), unit: t('unit.beta') },
      { id: '10', symbol: 'Pₛ', name: t('prop.Pv'), value: fmt(p.Pv, 4), unit: t('unit.Pv') },
      { id: '11', symbol: 'h', name: t('prop.h'), value: fmt(p.h, 2), unit: t('unit.h') },
      { id: '12', symbol: 'r', name: t('prop.hfg'), value: fmt(p.h_fg, 2), unit: t('unit.hfg') },
    ];
  }, [T, pMPa, t]);

  return (
    <div className="props-grid">
      {properties.map((prop, index) => (
        <div key={prop.id} className="prop-cell" style={{ animationDelay: `${index * 30}ms` }}>
          <div className="prop-cell-top">
            <span className="prop-num">{prop.id}</span>
            <span className="prop-symbol">{prop.symbol}</span>
          </div>
          <div className="prop-name">{prop.name}</div>
          <div className="prop-value-wrap">
            <div className="prop-value">{prop.value}</div>
            <div className="prop-unit">{prop.unit}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
