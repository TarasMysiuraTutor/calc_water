/**
 * water.js — Теплофізичні властивості води
 * Апроксимаційні формули на основі IAPWS-IF97
 * Діапазон: 0–370 °C, атмосферний тиск
 */

'use strict';

const Water = (() => {

  /**
   * Конвертація у Цельсій
   * @param {number} val
   * @param {'C'|'K'|'F'} unit
   * @returns {number}
   */

  function toCelsius(val, unit) {
    if (unit === 'K') return val - 273.15;
    if (unit === 'F') return (val - 32) * 5 / 9;
    return val;
  }

  /**
   * Визначення фази
   */
  function phase(T) {
    if (T < 0.01) return 'ice';
    if (T > 100)  return 'steam'; // перегріта рідина / кипіння
    return 'water';
  }

  /**
   * Розрахунок усіх теплофізичних властивостей
   * @param {number} T — температура в Цельсіях
   * @returns {object}
   */
  
  function compute(T) {
    const t  = T;
    const Tk = T + 273.15;

    // Густина (кг/м³) — поліном Kell (1975)
    const rho = (999.83952
      + 16.945176  * t
      - 7.9870401e-3 * t**2
      - 46.170461e-6 * t**3
      + 105.56302e-9 * t**4
      - 280.54253e-12 * t**5)
      / (1 + 16.879850e-3 * t);

    // Питома теплоємність Cp (Дж/(кг·К))
    const cp = 4215.9
      - 3.7254  * t
      + 1.4979e-2 * t**2
      - 1.5421e-5 * t**3
      + 5.9260e-9  * t**4;

    // Теплопровідність (Вт/(м·К))
    const lambda = 0.5650 + 1.796e-3 * t - 5.90e-6 * t**2;

    // Динамічна в'язкість (Па·с) — формула Vogel
    const mu = 2.414e-5 * Math.pow(10, 247.8 / (Tk - 140));

    // Кінематична в'язкість (м²/с)
    const nu = mu / rho;

    // Температуропровідність (м²/с)
    const a = lambda / (rho * cp);

    // Число Прандтля
    const Pr = mu * cp / lambda;

    // Поверхневий натяг (Н/м) — IAPWS 2014
    const Tc  = 647.096;
    const tau = 1 - Tk / Tc;
    const sigma = tau > 0
      ? 0.2358 * Math.pow(tau, 1.256) * (1 - 0.625 * tau)
      : 0;

    // Коефіцієнт об'ємного розширення (1/К)
    const beta = Math.max(0,
      -6.800e-5
      + 9.109e-6 * t
      - 1.00e-7  * t**2
      + 1.21e-9  * t**3
    );

    // Тиск насиченої пари (кПа) — рівняння Антуана
    const Pv = Math.pow(10, 8.07131 - 1730.63 / (233.426 + t)) * 0.133322;

    // Ентальпія (кДж/кг) — відносно 0°С
    const h = 4.1868 * t * (1 + 0.00055 * t);

    return { rho, cp, lambda, mu, nu, a, Pr, sigma, beta, Pv, h };
  }

  /**
   * Форматування числа для відображення
   * @param {number} val
   * @param {number} digits
   */
  function fmt(val, digits = 4) {
    if (val === undefined || val === null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(digits);
  }

  /**
   * Повертає масив описів властивостей з обчисленими значеннями
   */
  function getProperties(T) {
    const p = compute(T);
    return [
      {
        id: '01',
        symbol: 'ρ',
        name: 'Густина',
        value: fmt(p.rho, 3),
        unit: 'кг/м³',
        raw: p.rho,
      },
      {
        id: '02',
        symbol: 'cₚ',
        name: 'Питома теплоємність',
        value: fmt(p.cp, 1),
        unit: 'Дж/(кг·К)',
        raw: p.cp,
      },
      {
        id: '03',
        symbol: 'λ',
        name: 'Теплопровідність',
        value: fmt(p.lambda, 4),
        unit: 'Вт/(м·К)',
        raw: p.lambda,
      },
      {
        id: '04',
        symbol: 'a',
        name: 'Температуропровідність',
        value: fmt(p.a, 4),
        unit: 'м²/с',
        raw: p.a,
      },
      {
        id: '05',
        symbol: 'μ',
        name: 'Динамічна в\'язкість',
        value: fmt(p.mu, 5),
        unit: 'Па·с',
        raw: p.mu,
      },
      {
        id: '06',
        symbol: 'ν',
        name: 'Кінематична в\'язкість',
        value: fmt(p.nu, 4),
        unit: 'м²/с',
        raw: p.nu,
      },
      {
        id: '07',
        symbol: 'Pr',
        name: 'Число Прандтля',
        value: fmt(p.Pr, 3),
        unit: 'безрозмірне',
        raw: p.Pr,
      },
      {
        id: '08',
        symbol: 'σ',
        name: 'Поверхневий натяг',
        value: fmt(p.sigma, 5),
        unit: 'Н/м',
        raw: p.sigma,
      },
      {
        id: '09',
        symbol: 'β',
        name: 'Коеф. об\'ємного розширення',
        value: fmt(p.beta, 5),
        unit: '1/К',
        raw: p.beta,
      },
      {
        id: '10',
        symbol: 'Pₛ',
        name: 'Тиск насиченої пари',
        value: fmt(p.Pv, 4),
        unit: 'кПа',
        raw: p.Pv,
      },
      {
        id: '11',
        symbol: 'h',
        name: 'Ентальпія',
        value: fmt(p.h, 2),
        unit: 'кДж/кг',
        raw: p.h,
      },
    ];
  }

  return { toCelsius, phase, compute, getProperties, fmt };

})();
