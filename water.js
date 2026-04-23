/**
 * water.js — Теплофізичні властивості води та водяної пари
 *
 * Рідка фаза:   0 – 370 °C, 0.001 – 100 МПа.
 *   Корекція густини за тиском через ізотермічну стисливість.
 * Перегріта пара (T > T_насич): 0.001 – ~10 МПа, T до 800 °C.
 *   Густина — рівняння ідеального газу (R_s = 461.5 Дж/(кг·К));
 *   cp, λ, μ — інженерні поліноми/лінійні наближення (атм. тиск).
 *
 * Режим (рідина / пара) визначається автоматично за тиском
 * та температурою насичення (Антуан).
 */

'use strict';

const Water = (() => {

  const P_ATM_MPA = 0.101325;
  const KAPPA_T   = 4.5e-10; // 1/Па — ізотермічна стисливість (усереднено)

  function toCelsius(val, unit) {
    if (unit === 'K') return val - 273.15;
    if (unit === 'F') return (val - 32) * 5 / 9;
    return val;
  }

  function toMPa(val, unit) {
    switch (unit) {
      case 'kPa': return val / 1000;
      case 'bar': return val / 10;
      case 'atm': return val * P_ATM_MPA;
      default:    return val; // MPa
    }
  }

  /**
   * Температура насичення (°C) при заданому тиску (МПа)
   * Зворотне рівняння Антуана.
   */
  function saturationTemp(pMPa) {
    if (pMPa <= 0) return 0;
    const PmmHg = (pMPa * 1000) / 0.133322; // кПа → мм рт.ст.
    const denom = 8.07131 - Math.log10(PmmHg);
    if (denom <= 0) return 374; // близько критичної точки
    const T = 1730.63 / denom - 233.426;
    return T;
  }

  /**
   * Тиск насичення (МПа) при температурі (°C) — рівняння Антуана.
   */
  function saturationPressureMPa(T) {
    return Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 0.133322 / 1000;
  }

  /**
   * Фаза з урахуванням тиску.
   */
  function phase(T, pMPa) {
    if (pMPa == null) pMPa = P_ATM_MPA;
    if (T < 0.01) return 'ice';
    const Tsat = saturationTemp(pMPa);
    if (T > Tsat) return 'steam';
    return 'water';
  }

  /**
   * Властивості перегрітої водяної пари.
   * Густина — ідеальний газ; інші — інженерні наближення.
   */
  function computeSteam(T, pMPa) {
    const Tk  = T + 273.15;
    const Pa  = pMPa * 1e6;
    const R_s = 461.5; // Дж/(кг·К) питома газова стала для H₂O

    const rho = Pa / (R_s * Tk);

    // Питома теплоємність cp (Дж/(кг·К)) — поліном за T (°C)
    const cp = 2073 - 0.86 * T + 3.4e-3 * T * T;

    // Теплопровідність (Вт/(м·К))
    const lambda = 0.0163 + 8.4e-5 * T;

    // Динамічна в'язкість (Па·с)
    const mu = 7.9e-6 + 4.13e-8 * T;

    const nu = mu / rho;
    const a  = lambda / (rho * cp);
    const Pr = mu * cp / lambda;

    // Поверхневий натяг — не визначений у газовій фазі
    const sigma = NaN;

    // Об'ємне розширення для ідеального газу: β = 1/T_K
    const beta = 1 / Tk;

    // Тиск насичення при T (довідково)
    const Pv = saturationPressureMPa(T) * 1000;

    // Ентальпія: h_рід(Tsat) + h_fg(Tsat) + cp_пара·(T − Tsat)
    const Tsat   = saturationTemp(pMPa);
    const h_f    = 4.1868 * Tsat * (1 + 0.00055 * Tsat);   // кДж/кг
    const h_fg   = Math.max(0, 2501 - 2.36 * Tsat);        // кДж/кг
    const dT     = Math.max(0, T - Tsat);
    const h      = h_f + h_fg + (cp / 1000) * dT;

    return { rho, cp, lambda, mu, nu, a, Pr, sigma, beta, Pv, h };
  }

  function compute(T, pMPa) {
    if (pMPa == null) pMPa = P_ATM_MPA;
    const t  = T;
    const Tk = T + 273.15;

    // Густина при атмосферному тиску — поліном Kell
    const rho0 = (999.83952
      + 16.945176  * t
      - 7.9870401e-3 * t**2
      - 46.170461e-6 * t**3
      + 105.56302e-9 * t**4
      - 280.54253e-12 * t**5)
      / (1 + 16.879850e-3 * t);

    // Корекція густини за тиском: ρ(T,p) ≈ ρ(T,p₀) · (1 + κ_T·Δp)
    const dP_Pa = (pMPa - P_ATM_MPA) * 1e6;
    const rho = rho0 * (1 + KAPPA_T * dP_Pa);

    const cp = 4215.9
      - 3.7254  * t
      + 1.4979e-2 * t**2
      - 1.5421e-5 * t**3
      + 5.9260e-9  * t**4;

    const lambda = 0.5650 + 1.796e-3 * t - 5.90e-6 * t**2;
    const mu = 2.414e-5 * Math.pow(10, 247.8 / (Tk - 140));
    const nu = mu / rho;
    const a = lambda / (rho * cp);
    const Pr = mu * cp / lambda;

    const Tc  = 647.096;
    const tau = 1 - Tk / Tc;
    const sigma = tau > 0
      ? 0.2358 * Math.pow(tau, 1.256) * (1 - 0.625 * tau)
      : 0;

    const beta = Math.max(0,
      -6.800e-5
      + 9.109e-6 * t
      - 1.00e-7  * t**2
      + 1.21e-9  * t**3
    );

    // Тиск насиченої пари при заданій T (кПа)
    const Pv = saturationPressureMPa(t) * 1000;

    const h = 4.1868 * t * (1 + 0.00055 * t);

    return { rho, cp, lambda, mu, nu, a, Pr, sigma, beta, Pv, h };
  }

  function fmt(val, digits = 4) {
    if (val === undefined || val === null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(digits);
  }

  function _t(key) {
    return (typeof I18n !== 'undefined') ? I18n.t(key) : key;
  }

  function getProperties(T, pMPa) {
    if (pMPa == null) pMPa = P_ATM_MPA;
    const ph = phase(T, pMPa);
    const p = (ph === 'steam') ? computeSteam(T, pMPa) : compute(T, pMPa);
    return [
      { id: '01', symbol: 'ρ',  name: _t('prop.density'), value: fmt(p.rho, 3),    unit: _t('unit.density'), raw: p.rho },
      { id: '02', symbol: 'cₚ', name: _t('prop.cp'),      value: fmt(p.cp, 1),     unit: _t('unit.cp'),      raw: p.cp },
      { id: '03', symbol: 'λ',  name: _t('prop.lambda'),  value: fmt(p.lambda, 4), unit: _t('unit.lambda'),  raw: p.lambda },
      { id: '04', symbol: 'a',  name: _t('prop.a'),       value: fmt(p.a, 4),      unit: _t('unit.a'),       raw: p.a },
      { id: '05', symbol: 'μ',  name: _t('prop.mu'),      value: fmt(p.mu, 5),     unit: _t('unit.mu'),      raw: p.mu },
      { id: '06', symbol: 'ν',  name: _t('prop.nu'),      value: fmt(p.nu, 4),     unit: _t('unit.nu'),      raw: p.nu },
      { id: '07', symbol: 'Pr', name: _t('prop.Pr'),      value: fmt(p.Pr, 3),     unit: _t('unit.Pr'),      raw: p.Pr },
      { id: '08', symbol: 'σ',  name: _t('prop.sigma'),   value: fmt(p.sigma, 5),  unit: _t('unit.sigma'),   raw: p.sigma },
      { id: '09', symbol: 'β',  name: _t('prop.beta'),    value: fmt(p.beta, 5),   unit: _t('unit.beta'),    raw: p.beta },
      { id: '10', symbol: 'Pₛ', name: _t('prop.Pv'),      value: fmt(p.Pv, 4),     unit: _t('unit.Pv'),      raw: p.Pv },
      { id: '11', symbol: 'h',  name: _t('prop.h'),       value: fmt(p.h, 2),      unit: _t('unit.h'),       raw: p.h },
    ];
  }

  return {
    toCelsius, toMPa, phase, compute, computeSteam, getProperties, fmt,
    saturationTemp, saturationPressureMPa, P_ATM_MPA,
  };

})();
