"use strict";

/*
 * engine.js — логіка розрахунку
 * ВІДНОВЛЮЄ ПОВНИЙ НАБІР ВЛАСТИВОСТЕЙ (≈13)
 * ПРАЦЮЄ з існуючим UI БЕЗ ПЕРЕРОБОК
 */

const Engine = (() => {

  function buildProperties(T, pMPa, phase) {
    let base;

    if (phase === "ice") {
      base = Water.computeIce(T, pMPa);
    } else if (phase === "steam") {
      base = Water.computeSteam(T, pMPa);
    } else {
      base = Water.compute(T, pMPa);
    }

    return {
      rho:    base.rho,
      v:      base.v,
      cp:     base.cp,
      lambda: base.lambda,
      mu:     base.mu,
      nu:     base.nu,
      Pr:     base.Pr,
      a:      base.a,
      beta:   base.beta,
      sigma:  base.sigma,
      Pv:     base.Pv,
      h:      base.h,
      gamma:  base.gamma,
      sound:  base.sound
    };
  }

  function compute({ mode = "normal", T, pMPa }) {

    // базові величини
    let TT = T;
    let p  = pMPa;

    const Tsat = Water.saturationTemp(pMPa);
    const Psat = Water.saturationPressureMPa(T);

    // режим насичення
    if (mode === "saturation") {
      TT = Tsat;
      p  = Water.saturationPressureMPa(Tsat);
    }

    const ph = Water.phase(TT, p);

    // ✅ ПОВНИЙ НАБІР ВЛАСТИВОСТЕЙ
    const props = buildProperties(TT, p, ph);

    // ✅ теплота пароутворення — ТІЛЬКИ для saturation
    if (mode === "saturation" && ph === "steam") {
      const hSteam  = Water.computeSteam(Tsat, p).h;
      const hLiquid = Water.compute(Tsat, p).h;
      props.r = hSteam - hLiquid; // кДж/кг
    }

    return {
      mode,
      phase: ph,
      T: TT,
      pMPa: p,
      Tsat,
      Psat,
      props
    };
  }

  return { compute };
})();
