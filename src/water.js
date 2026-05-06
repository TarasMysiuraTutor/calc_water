"use strict";

const Water = (() => {
  const P_ATM_MPA = 0.101325;

  function saturationTemp(pMPa) {
    if (pMPa <= 0) return 0;
    const PmmHg = (pMPa * 1000) / 0.133322;
    const denom = 8.07131 - Math.log10(PmmHg);
    if (denom <= 0) return 374;
    return 1730.63 / denom - 233.426;
  }

  function saturationPressureMPa(T) {
    return (Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 0.133322) / 1000;
  }

  function phase(T, pMPa) {
    const Tsat = saturationTemp(pMPa);
    if (T < 0) return "ice";
    if (T > Tsat) return "steam";
    return "water";
  }

  function compute(T, pMPa) {
    const rho = 1000 - 0.3 * T;
    const cp = 4180;
    const h = 4.1868 * T;
    return { rho, cp, h };
  }

  function computeSteam(T, pMPa) {
    const Tk = T + 273.15;
    const rho = (pMPa * 1e6) / (461.5 * Tk);
    const cp = 2100;
    const h = 2500 + cp * (T - 100) / 1000;
    return { rho, cp, h };
  }

  function computeIce(T) {
    return { rho: 920, cp: 2100, h: -333 };
  }

  return {
    P_ATM_MPA,
    saturationTemp,
    saturationPressureMPa,
    phase,
    compute,
    computeSteam,
    computeIce
  };
})();
``