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

const P_ATM_MPA = 0.101325;
const KAPPA_T = 4.5e-10; // 1/Па — ізотермічна стисливість (усереднено)

export function toCelsius(val, unit) {
  if (unit === 'K') return val - 273.15;
  if (unit === 'F') return (val - 32) * 5 / 9;
  return val;
}

export function toMPa(val, unit) {
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
export function saturationTemp(pMPa) {
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
export function saturationPressureMPa(T) {
  return Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 0.133322 / 1000;
}

/**
 * Фаза з урахуванням тиску.
 */
export function phase(T, pMPa) {
  if (pMPa == null) pMPa = P_ATM_MPA;
  if (T < 0.01) return 'ice';
  const Tsat = saturationTemp(pMPa);
  if (T > Tsat) return 'steam';
  return 'water';
}

/**
 * Прихована теплота пароутворення (кДж/кг) за кореляцією Watson.
 * Аргумент — температура у °C.
 */
export function latentHeat(Tcels) {
  const Tc = 647.1;          // K — критична температура води
  const Tk = Tcels + 273.15;
  if (Tk >= Tc) return 0;
  return 262.1 * Math.pow(Tc - Tk, 0.38);
}

/**
 * Властивості перегрітої водяної пари.
 * Густина — ідеальний газ; інші — інженерні наближення.
 */
export function computeSteam(T, pMPa) {
  const Tk  = T + 273.15;
  const Pa  = pMPa * 1e6;
  const R_s = 461.5; // Дж/(кг·К) питома газова стала для H₂O

  const rho = Pa / (R_s * Tk);
  const v   = 1 / rho;       // питомий об'єм, м³/кг

  // Питома теплоємність cp (Дж/(кг·К)) — поліном за T (°C)
  const cp = 2073 - 0.86 * T + 3.4e-3 * T * T;
  const cv = cp - R_s;
  const gamma = cp / cv;
  const sound = Math.sqrt(gamma * R_s * Tk); // м/с

  const lambda = 0.0163 + 8.4e-5 * T;
  const mu     = 7.9e-6 + 4.13e-8 * T;

  const nu = mu / rho;
  const a  = lambda / (rho * cp);
  const Pr = mu * cp / lambda;

  // Об'ємне розширення для ідеального газу: β = 1/T_K
  const beta = 1 / Tk;

  // Ентальпія: h_рід(Tsat) + h_fg(Tsat) + cp_пара·(T − Tsat)
  const Tsat = saturationTemp(pMPa);
  const h_f  = 4.1868 * Tsat * (1 + 0.00055 * Tsat); // кДж/кг
  const h_fg = latentHeat(Tsat);                     // кДж/кг (при поточному P)
  const dT   = Math.max(0, T - Tsat);
  const h    = h_f + h_fg + (cp / 1000) * dT;

  return { rho, v, cp, gamma, sound, lambda, mu, nu, a, Pr, beta, h, h_fg };
}

/**
 * Насичена пара за заданою температурою (°C).
 * Повертає властивості "сухої насиченої пари" (x = 1).
 */
export function saturatedSteamByTemp(TsatC) {
  const pMPa = saturationPressureMPa(TsatC);
  return saturatedSteamByPressure(pMPa);
}

/**
 * Насичена пара за заданим тиском (МПа).
 * Повертає властивості "сухої насиченої пари" (x = 1).
 */
export function saturatedSteamByPressure(pMPa) {
  const TsatC = saturationTemp(pMPa);
  const steam = computeSteam(TsatC, pMPa);
  const water = compute(TsatC, pMPa);
  const h_fg = latentHeat(TsatC);
  const h_g = water.h + h_fg;

  return {
    mode: 'saturated_steam',
    x: 1,
    TsatC,
    pMPa,
    rho_g: steam.rho,
    v_g: steam.v,
    h_g,
    h_fg,
    cp_g: steam.cp,
    mu_g: steam.mu,
    lambda_g: steam.lambda,
  };
}

/**
 * Властивості рідкої води.
 */
export function compute(T, pMPa) {
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

  // Теплота пароутворення при температурі насичення для поточного P
  const Tsat = saturationTemp(pMPa);
  const h_fg = latentHeat(Tsat);

  return { rho, cp, lambda, mu, nu, a, Pr, sigma, beta, Pv, h, h_fg };
}

/**
 * Температура плавлення (замерзання) льоду Ih при заданому тиску.
 * Кореляція IAPWS R14-08 (рівняння плавлення Ih), розв'язується ітерацією Ньютона.
 */
export function meltingTemp(pMPa) {
  if (pMPa == null) pMPa = P_ATM_MPA;
  if (pMPa <= 611.657e-6) return 0.01;
  const pn = 611.657e-6;          // МПа (тиск потрійної точки)
  const Tn = 273.16;              // К
  const pi = pMPa / pn;
  let theta = 1.0;                // початкове наближення
  for (let i = 0; i < 80; i++) {
    const t_neg3 = Math.pow(theta, -3);
    const t_21 = Math.pow(theta, 21.2);
    const F  = 1 - 0.626e6 * (1 - t_neg3) + 0.197135e6 * (1 - t_21) - pi;
    const Fp = -0.626e6 * (3 * Math.pow(theta, -4))
              + 0.197135e6 * (-21.2 * Math.pow(theta, 20.2));
    const dx = F / Fp;
    theta -= dx;
    if (!isFinite(theta) || theta <= 0) { theta = 1; break; }
    if (Math.abs(dx) < 1e-12) break;
  }
  return theta * Tn - 273.15;
}

/**
 * Властивості льоду Ih при тиску близькому до атмосферного.
 */
export function computeIce(T, pMPa) {
  if (pMPa == null) pMPa = P_ATM_MPA;
  const Tc = T;            // °C
  const Tk = T + 273.15;   // K

  // Густина (Pounder): 916.7 - 0.1403·T_C [kg/m³]
  const rho = 916.7 - 0.1403 * Tc;

  // Питома теплоємність (підгонка до IAPWS R10-06): 2096.6 + 6.49·T_C [J/(kg·K)]
  const cp = 2096.6 + 6.49 * Tc;

  // Теплопровідність (Andersson & Inaba): 632/T_K + 0.38 - 0.00197·T_K [W/(m·K)]
  const lambda = 632 / Tk + 0.38 - 0.00197 * Tk;

  // Температуропровідність a = λ/(ρ·cp) [m²/s]
  const a = lambda / (rho * cp);

  // Об'ємний коефіцієнт теплового розширення β = 3·α_L
  const beta = 3 * (53e-6 + 0.36e-6 * Tc); // [1/K], зменшується при зниженні T

  // Прихована теплота плавлення при 0°C [kJ/kg] — при стандартному тиску
  const h_sf = 333.55;

  // Питома ентальпія льоду відносно рідкої води при 0°C [kJ/kg]
  const h = -h_sf + (2.0966 * Tc + (6.49 / 2) * Tc * Tc / 1000);

  // Швидкість звуку (поздовжня) у льоду Ih: c ≈ 3840 + 4·T_C [m/s]
  const sound = 3840 + 4 * Tc;

  return {
    T: Tc, pMPa,
    rho, cp, lambda, a, beta,
    h_sf, h, sound,
  };
}

export function fmt(val, digits = 4) {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const abs = Math.abs(val);
  if (abs === 0) return '0';
  if (abs < 1e-4 || abs >= 1e6) return val.toExponential(3);
  return val.toFixed(digits);
}

export const Water = {
  P_ATM_MPA,
  toCelsius,
  toMPa,
  phase,
  compute,
  computeSteam,
  saturatedSteamByTemp,
  saturatedSteamByPressure,
  computeIce,
  saturationTemp,
  saturationPressureMPa,
  meltingTemp,
  fmt,
};

export default Water;
