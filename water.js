/**
 * water.js — Теплофізичні властивості рідин харчової промисловості
 * Вода: апроксимаційні формули на основі IAPWS-IF97
 * Інші рідини: апроксимації за довідниками Choi & Okos, Perry's, Noureddini
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   ВОДА  (IAPWS-IF97)
   Діапазон: 0–370 °C
═══════════════════════════════════════════════════════════════ */
const Water = (() => {

  function toCelsius(val, unit) {
    if (unit === 'K') return val - 273.15;
    if (unit === 'F') return (val - 32) * 5 / 9;
    return val;
  }

  function phase(T) {
    if (T < 0.01) return 'ice';
    if (T > 100)  return 'steam';
    return 'water';
  }

  function compute(T) {
    const t  = T;
    const Tk = T + 273.15;

    const rho = (999.83952
      + 16.945176  * t
      - 7.9870401e-3 * t**2
      - 46.170461e-6 * t**3
      + 105.56302e-9 * t**4
      - 280.54253e-12 * t**5)
      / (1 + 16.879850e-3 * t);

    const cp = 4215.9
      - 3.7254  * t
      + 1.4979e-2 * t**2
      - 1.5421e-5 * t**3
      + 5.9260e-9  * t**4;

    const lambda = 0.5650 + 1.796e-3 * t - 5.90e-6 * t**2;
    const mu     = 2.414e-5 * Math.pow(10, 247.8 / (Tk - 140));
    const nu     = mu / rho;
    const a      = lambda / (rho * cp);
    const Pr     = mu * cp / lambda;

    const Tc  = 647.096;
    const tau = 1 - Tk / Tc;
    const sigma = tau > 0 ? 0.2358 * Math.pow(tau, 1.256) * (1 - 0.625 * tau) : 0;

    const beta = Math.max(0, -6.800e-5 + 9.109e-6 * t - 1.00e-7 * t**2 + 1.21e-9 * t**3);
    const Pv   = Math.pow(10, 8.07131 - 1730.63 / (233.426 + t)) * 0.133322;
    const h    = 4.1868 * t * (1 + 0.00055 * t);

    return { rho, cp, lambda, mu, nu, a, Pr, sigma, beta, Pv, h };
  }

  function fmt(val, digits = 4) {
    if (val === undefined || val === null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(digits);
  }

  function getProperties(T) {
    const p = compute(T);
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                     value:fmt(p.rho,3),    unit:'кг/м³',       raw:p.rho },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',         value:fmt(p.cp,1),     unit:'Дж/(кг·К)',   raw:p.cp },
      { id:'03', symbol:'λ',  name:'Теплопровідність',            value:fmt(p.lambda,4), unit:'Вт/(м·К)',    raw:p.lambda },
      { id:'04', symbol:'a',  name:'Температуропровідність',      value:fmt(p.a,4),      unit:'м²/с',        raw:p.a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",         value:fmt(p.mu,5),     unit:'Па·с',        raw:p.mu },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",       value:fmt(p.nu,4),     unit:'м²/с',        raw:p.nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',              value:fmt(p.Pr,3),     unit:'безрозмірне', raw:p.Pr },
      { id:'08', symbol:'σ',  name:'Поверхневий натяг',           value:fmt(p.sigma,5),  unit:'Н/м',         raw:p.sigma },
      { id:'09', symbol:'β',  name:"Коеф. об'ємного розширення",  value:fmt(p.beta,5),   unit:'1/К',         raw:p.beta },
      { id:'10', symbol:'Pₛ', name:'Тиск насиченої пари',         value:fmt(p.Pv,4),     unit:'кПа',         raw:p.Pv },
      { id:'11', symbol:'h',  name:'Ентальпія',                   value:fmt(p.h,2),      unit:'кДж/кг',      raw:p.h },
    ];
  }

  return { toCelsius, phase, compute, getProperties, fmt };
})();


/* ═══════════════════════════════════════════════════════════════
   МОЛОКО та МОЛОЧНІ ПРОДУКТИ
   Джерело: Choi & Okos (1986), Dairy Processing Handbook
   Діапазон: 0–80 °C
═══════════════════════════════════════════════════════════════ */
const Milk = (() => {

  const substances = {
    whole_milk: { name: 'Незбиране молоко (3.5% жиру)', range:[0,80], note:'0 – 80 °C' },
    skim_milk:  { name: 'Знежирене молоко',              range:[0,80], note:'0 – 80 °C' },
    cream_20:   { name: 'Вершки 20%',                   range:[0,80], note:'0 – 80 °C' },
    cream_35:   { name: 'Вершки 35%',                   range:[0,80], note:'0 – 80 °C' },
  };

  const compositions = {
    whole_milk: { Xw:0.874, Xf:0.035, Xp:0.032, Xl:0.048, Xa:0.007 },
    skim_milk:  { Xw:0.909, Xf:0.001, Xp:0.036, Xl:0.048, Xa:0.007 },
    cream_20:   { Xw:0.731, Xf:0.200, Xp:0.029, Xl:0.033, Xa:0.006 },
    cream_35:   { Xw:0.582, Xf:0.350, Xp:0.025, Xl:0.030, Xa:0.005 },
  };

  const rhoCoef = {
    water:   [997.18,  -0.3168],
    fat:     [925.59,  -0.4176],
    protein: [1329.90, -0.5184],
    lactose: [1592.90, -0.06524],
    ash:     [2418.20, -0.2806],
  };
  const cpCoef = {
    water:   [4176.2,  -0.09],
    fat:     [1984.5,   1.4732],
    protein: [2008.2,   1.2089],
    lactose: [1548.8,   1.9625],
    ash:     [1092.6,   1.8896],
  };
  const lambdaCoef = {
    water:   [0.57109,  1.7625e-3],
    fat:     [0.18071, -2.7604e-4],
    protein: [0.17881,  1.1958e-3],
    lactose: [0.19480,  1.4661e-3],
    ash:     [0.36589, -1.3707e-4],
  };

  function compProp(coef, comp, T) {
    const keys = ['water','fat','protein','lactose','ash'];
    const Xi   = [comp.Xw, comp.Xf, comp.Xp, comp.Xl, comp.Xa];
    return keys.reduce((s, k, i) => s + Xi[i] * (coef[k][0] + coef[k][1] * T), 0);
  }

  function fmt(val, d=4) {
    if (!isFinite(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(d);
  }

  function getProperties(key, T) {
    const comp   = compositions[key];
    const rho    = compProp(rhoCoef,    comp, T);
    const cp     = compProp(cpCoef,     comp, T);
    const lambda = compProp(lambdaCoef, comp, T);
    const mu     = key === 'skim_milk'       ? 2.0e-3 * Math.exp(-0.031 * T)
                 : key.startsWith('cream')   ? 4.5e-3 * Math.exp(-0.032 * T)
                 :                             2.5e-3 * Math.exp(-0.031 * T);
    const nu = mu / rho;
    const a  = lambda / (rho * cp);
    const Pr = mu * cp / lambda;
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                value:fmt(rho,2),    unit:'кг/м³',       raw:rho },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',    value:fmt(cp,1),     unit:'Дж/(кг·К)',   raw:cp },
      { id:'03', symbol:'λ',  name:'Теплопровідність',       value:fmt(lambda,4), unit:'Вт/(м·К)',    raw:lambda },
      { id:'04', symbol:'a',  name:'Температуропровідність', value:fmt(a,4),      unit:'м²/с',        raw:a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",    value:fmt(mu,5),     unit:'Па·с',        raw:mu },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",  value:fmt(nu,4),     unit:'м²/с',        raw:nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',         value:fmt(Pr,3),     unit:'безрозмірне', raw:Pr },
    ];
  }

  return { substances, getProperties };
})();


/* ═══════════════════════════════════════════════════════════════
   ОЛІЇ ТА ЖИРИ
   Джерело: Choi & Okos (1986), Noureddini et al. (1992)
   Діапазон: 0–200 °C
═══════════════════════════════════════════════════════════════ */
const Oils = (() => {

  const substances = {
    sunflower: { name: 'Соняшникова олія',        range:[0,200],  note:'0 – 200 °C' },
    soybean:   { name: 'Соєва олія',              range:[0,200],  note:'0 – 200 °C' },
    olive:     { name: 'Оливкова олія',           range:[0,200],  note:'0 – 200 °C' },
    palm:      { name: 'Пальмова олія',           range:[30,200], note:'30 – 200 °C' },
    lard:      { name: 'Свинячий жир (смалець)',  range:[45,200], note:'45 – 200 °C' },
  };

  const rhoP = {
    sunflower: [929.0, -0.652],
    soybean:   [927.0, -0.641],
    olive:     [914.0, -0.632],
    palm:      [928.0, -0.663],
    lard:      [918.0, -0.649],
  };
  const cpP = {
    sunflower: [1925.0, 4.1],
    soybean:   [1930.0, 4.0],
    olive:     [1910.0, 4.0],
    palm:      [1900.0, 4.2],
    lard:      [1890.0, 4.3],
  };
  const lambdaP = {
    sunflower: [0.1763, -1.25e-4],
    soybean:   [0.1700, -1.18e-4],
    olive:     [0.1700, -1.20e-4],
    palm:      [0.1780, -1.22e-4],
    lard:      [0.1750, -1.15e-4],
  };
  const muAB = {
    sunflower: [1.20e-5, 3560],
    soybean:   [1.10e-5, 3570],
    olive:     [1.50e-5, 3460],
    palm:      [1.35e-5, 3580],
    lard:      [1.40e-5, 3500],
  };

  function fmt(val, d=4) {
    if (!isFinite(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(d);
  }

  function getProperties(key, T) {
    const Tk = T + 273.15;
    const r  = rhoP[key][0]    + rhoP[key][1]    * T;
    const c  = cpP[key][0]     + cpP[key][1]     * T;
    const l  = lambdaP[key][0] + lambdaP[key][1] * T;
    const m  = muAB[key][0] * Math.exp(muAB[key][1] / Tk);
    const nu = m / r;
    const a  = l / (r * c);
    const Pr = m * c / l;
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                value:fmt(r,2),    unit:'кг/м³',       raw:r },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',    value:fmt(c,1),    unit:'Дж/(кг·К)',   raw:c },
      { id:'03', symbol:'λ',  name:'Теплопровідність',       value:fmt(l,4),    unit:'Вт/(м·К)',    raw:l },
      { id:'04', symbol:'a',  name:'Температуропровідність', value:fmt(a,4),    unit:'м²/с',        raw:a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",    value:fmt(m,5),    unit:'Па·с',        raw:m },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",  value:fmt(nu,4),   unit:'м²/с',        raw:nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',         value:fmt(Pr,3),   unit:'безрозмірне', raw:Pr },
    ];
  }

  return { substances, getProperties };
})();


/* ═══════════════════════════════════════════════════════════════
   ЦУКРОВІ РОЗЧИНИ (сахарозо-водні)
   Джерело: Bubnik & Kadlec (1992), Starzak & Mathlouthi (2006)
   Діапазон: 0–100 °C, 10–70% цукру
═══════════════════════════════════════════════════════════════ */
const Sugar = (() => {

  const substances = {
    sugar_10: { name: 'Цукровий розчин 10%', conc:10, range:[0,100],  note:'0 – 100 °C' },
    sugar_20: { name: 'Цукровий розчин 20%', conc:20, range:[0,100],  note:'0 – 100 °C' },
    sugar_30: { name: 'Цукровий розчин 30%', conc:30, range:[0,100],  note:'0 – 100 °C' },
    sugar_40: { name: 'Цукровий розчин 40%', conc:40, range:[0,100],  note:'0 – 100 °C' },
    sugar_60: { name: 'Цукровий розчин 60%', conc:60, range:[0,100],  note:'0 – 100 °C' },
    sugar_70: { name: 'Сироп 70% (меляса)',  conc:70, range:[20,100], note:'20 – 100 °C' },
  };

  function rho(C, T) {
    const Xc = C / 100;
    return 1000 * (
      (1 - Xc) * (0.99997 + 2.5e-4 * T - 5.5e-6 * T**2)
      + Xc     * (1.5990  - 8.5e-4 * T)
    );
  }
  function cp(C, T) {
    const Xc   = C / 100;
    const cp_w = 4215.9 - 3.7254 * T + 1.4979e-2 * T**2;
    const cp_s = 1244.0 + 4.3 * T;
    return (1 - Xc) * cp_w + Xc * cp_s;
  }
  function lambda(C, T) {
    const Xc = C / 100;
    return (0.5710 + 1.88e-3 * T - 7.9e-6 * T**2) * (1 - 0.54 * Xc);
  }
  function mu(C, T) {
    const Tk   = T + 273.15;
    const Xc   = C / 100;
    const mu_w = 2.414e-5 * Math.pow(10, 247.8 / (Tk - 140));
    const A    = 1 + 2.8 * Xc + 12.0 * Xc**2 + 80.0 * Xc**3;
    return mu_w * A;
  }

  function fmt(val, d=4) {
    if (!isFinite(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(d);
  }

  function getProperties(key, T) {
    const C  = substances[key].conc;
    const r  = rho(C, T);
    const c  = cp(C, T);
    const l  = lambda(C, T);
    const m  = mu(C, T);
    const nu = m / r;
    const a  = l / (r * c);
    const Pr = m * c / l;
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                value:fmt(r,2),    unit:'кг/м³',       raw:r },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',    value:fmt(c,1),    unit:'Дж/(кг·К)',   raw:c },
      { id:'03', symbol:'λ',  name:'Теплопровідність',       value:fmt(l,4),    unit:'Вт/(м·К)',    raw:l },
      { id:'04', symbol:'a',  name:'Температуропровідність', value:fmt(a,4),    unit:'м²/с',        raw:a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",    value:fmt(m,5),    unit:'Па·с',        raw:m },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",  value:fmt(nu,4),   unit:'м²/с',        raw:nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',         value:fmt(Pr,3),   unit:'безрозмірне', raw:Pr },
    ];
  }

  return { substances, getProperties };
})();


/* ═══════════════════════════════════════════════════════════════
   СОКИ ТА НАПОЇ
   Джерело: Choi & Okos (1986), Constenla et al. (1989)
   Діапазон: 0–90 °C
═══════════════════════════════════════════════════════════════ */
const Juices = (() => {

  const substances = {
    apple_juice:  { name: 'Яблучний сік (11°Brix)',   range:[0,90], note:'0 – 90 °C' },
    orange_juice: { name: 'Апельсиновий сік (12°Brix)',range:[0,90], note:'0 – 90 °C' },
    tomato_juice: { name: 'Томатний сік (5°Brix)',    range:[0,90], note:'0 – 90 °C' },
    grape_juice:  { name: 'Виноградний сік (16°Brix)',range:[0,90], note:'0 – 90 °C' },
    beer:         { name: 'Пиво (5% алк.)',            range:[0,20], note:'0 – 20 °C' },
  };

  const rhoP = {
    apple_juice:  [1052.0, -0.36],
    orange_juice: [1055.0, -0.38],
    tomato_juice: [1025.0, -0.31],
    grape_juice:  [1070.0, -0.42],
    beer:         [1014.0, -0.35],
  };
  const cpP = {
    apple_juice:  [3850.0, 1.2],
    orange_juice: [3840.0, 1.2],
    tomato_juice: [3970.0, 1.1],
    grape_juice:  [3760.0, 1.3],
    beer:         [4030.0, 0.9],
  };
  const lambdaP = {
    apple_juice:  [0.548, 1.50e-3],
    orange_juice: [0.545, 1.48e-3],
    tomato_juice: [0.560, 1.55e-3],
    grape_juice:  [0.536, 1.42e-3],
    beer:         [0.572, 1.70e-3],
  };
  const muFactor = {
    apple_juice:1.40, orange_juice:1.45,
    tomato_juice:1.55, grape_juice:1.60, beer:1.12
  };

  function fmt(val, d=4) {
    if (!isFinite(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(d);
  }

  function getProperties(key, T) {
    const Tk = T + 273.15;
    const r  = rhoP[key][0]    + rhoP[key][1]    * T;
    const c  = cpP[key][0]     + cpP[key][1]     * T;
    const l  = lambdaP[key][0] + lambdaP[key][1] * T;
    const mu_w = 2.414e-5 * Math.pow(10, 247.8 / (Tk - 140));
    const m  = mu_w * muFactor[key];
    const nu = m / r;
    const a  = l / (r * c);
    const Pr = m * c / l;
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                value:fmt(r,2),    unit:'кг/м³',       raw:r },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',    value:fmt(c,1),    unit:'Дж/(кг·К)',   raw:c },
      { id:'03', symbol:'λ',  name:'Теплопровідність',       value:fmt(l,4),    unit:'Вт/(м·К)',    raw:l },
      { id:'04', symbol:'a',  name:'Температуропровідність', value:fmt(a,4),    unit:'м²/с',        raw:a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",    value:fmt(m,5),    unit:'Па·с',        raw:m },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",  value:fmt(nu,4),   unit:'м²/с',        raw:nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',         value:fmt(Pr,3),   unit:'безрозмірне', raw:Pr },
    ];
  }

  return { substances, getProperties };
})();


/* ═══════════════════════════════════════════════════════════════
   СПИРТ ТА ВОДНО-СПИРТОВІ РОЗЧИНИ
   Джерело: Perry's Chemical Engineers' Handbook (8th ed.)
   Діапазон: 0–78 °C
═══════════════════════════════════════════════════════════════ */
const Alcohol = (() => {

  const substances = {
    ethanol_96: { name: 'Етанол 96% (харч. спирт)',    range:[0,78],   note:'0 – 78 °C' },
    ethanol_70: { name: 'Етанол 70% (дезінфікуючий)',  range:[0,78],   note:'0 – 78 °C' },
    ethanol_40: { name: 'Горілка 40%',                  range:[0,70],   note:'0 – 70 °C' },
    ethanol_12: { name: 'Вино 12%',                     range:[0,40],   note:'0 – 40 °C' },
    glycerol:   { name: 'Гліцерин харч. (E422)',        range:[20,200], note:'20 – 200 °C' },
  };

  const rhoFn = {
    ethanol_96: T => 806.4  - 0.857 * T,
    ethanol_70: T => 886.2  - 0.749 * T,
    ethanol_40: T => 944.0  - 0.606 * T,
    ethanol_12: T => 992.0  - 0.415 * T,
    glycerol:   T => 1264.0 - 0.620 * T,
  };
  const cpFn = {
    ethanol_96: T => 2400.0 + 5.0 * T,
    ethanol_70: T => 2900.0 + 4.2 * T,
    ethanol_40: T => 3400.0 + 3.5 * T,
    ethanol_12: T => 4050.0 + 1.8 * T,
    glycerol:   T => 2380.0 + 3.0 * T,
  };
  const lambdaFn = {
    ethanol_96: T => 0.1700 - 1.5e-4 * T,
    ethanol_70: T => 0.2800 - 8.0e-5 * T,
    ethanol_40: T => 0.3900 - 5.0e-5 * T,
    ethanol_12: T => 0.5400 + 1.6e-3 * T - 7e-6 * T**2,
    glycerol:   T => 0.2840 - 3.0e-5 * T,
  };
  const muAB = {
    ethanol_96: [7.40e-7, 1930],
    ethanol_70: [1.50e-6, 1780],
    ethanol_40: [3.20e-6, 1600],
    ethanol_12: [1.20e-5, 1250],
    glycerol:   [1.20e-3,  800],
  };

  function fmt(val, d=4) {
    if (!isFinite(val)) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
    return val.toFixed(d);
  }

  function getProperties(key, T) {
    const Tk = T + 273.15;
    const r  = rhoFn[key](T);
    const c  = cpFn[key](T);
    const l  = lambdaFn[key](T);
    const m  = muAB[key][0] * Math.exp(muAB[key][1] / Tk);
    const nu = m / r;
    const a  = l / (r * c);
    const Pr = m * c / l;
    return [
      { id:'01', symbol:'ρ',  name:'Густина',                value:fmt(r,2),    unit:'кг/м³',       raw:r },
      { id:'02', symbol:'cₚ', name:'Питома теплоємність',    value:fmt(c,1),    unit:'Дж/(кг·К)',   raw:c },
      { id:'03', symbol:'λ',  name:'Теплопровідність',       value:fmt(l,4),    unit:'Вт/(м·К)',    raw:l },
      { id:'04', symbol:'a',  name:'Температуропровідність', value:fmt(a,4),    unit:'м²/с',        raw:a },
      { id:'05', symbol:'μ',  name:"Динамічна в'язкість",    value:fmt(m,5),    unit:'Па·с',        raw:m },
      { id:'06', symbol:'ν',  name:"Кінематична в'язкість",  value:fmt(nu,4),   unit:'м²/с',        raw:nu },
      { id:'07', symbol:'Pr', name:'Число Прандтля',         value:fmt(Pr,3),   unit:'безрозмірне', raw:Pr },
    ];
  }

  return { substances, getProperties };
})();


/* ═══════════════════════════════════════════════════════════════
   РЕЄСТР ГРУП РЕЧОВИН
═══════════════════════════════════════════════════════════════ */
const SubstanceRegistry = {
  water: {
    label: 'Вода',
    icon: '💧',
    module: null,
    substances: { water: { name: 'Вода (H₂O)', range:[0,370], note:'0 – 370 °C · IAPWS-IF97' } }
  },
  milk:    { label: 'Молоко та вершки', icon: '🥛', module: Milk,    substances: Milk.substances },
  oils:    { label: 'Олії та жири',     icon: '🫙', module: Oils,    substances: Oils.substances },
  sugar:   { label: 'Цукрові розчини',  icon: '🍬', module: Sugar,   substances: Sugar.substances },
  juices:  { label: 'Соки та напої',    icon: '🍊', module: Juices,  substances: Juices.substances },
  alcohol: { label: 'Спирт та розчини', icon: '🍷', module: Alcohol, substances: Alcohol.substances },
};