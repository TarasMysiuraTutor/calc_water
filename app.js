/**
 * app.js — UI-логіка калькулятора теплофізичних властивостей води
 */

'use strict';

const App = (() => {

  let currentUnit = 'C';
  let currentPUnit = 'MPa';
  let lastT = null; // { T, raw, pMPa, pRaw, pUnit }

  const HISTORY_KEY = 'h2o.history';
  const HISTORY_LIMIT = 10;
  let history = [];

  const $input      = document.getElementById('tempInput');
  const $inputUnit  = document.getElementById('inputUnitLabel');
  const $pInput     = document.getElementById('pressureInput');
  const $pUnitLabel = document.getElementById('pressureUnitLabel');
  const $error      = document.getElementById('errorBanner');
  const $results    = document.getElementById('resultsSection');
  const $tempDisp   = document.getElementById('tempDisplay');
  const $pressDisp  = document.getElementById('pressureDisplay');
  const $phaseTag   = document.getElementById('phaseTag');
  const $tsatDisp   = document.getElementById('tsatDisplay');
  const $tmeltDisp  = document.getElementById('tmeltDisplay');

  function setupTempClickFill(container, valueSelector, attrName) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const el = e.target.closest(valueSelector);
      if (!el) return;
      const tC = parseFloat(el.getAttribute(attrName));
      if (isNaN(tC)) return;
      let val = tC;
      if (currentUnit === 'K') val = tC + 273.15;
      else if (currentUnit === 'F') val = tC * 9 / 5 + 32;
      $input.value = val.toFixed(2);
      calculate();
    });
  }
  setupTempClickFill($tsatDisp,  '.tsat-value',  'data-tsat-c');
  setupTempClickFill($tmeltDisp, '.tmelt-value', 'data-t-c');
  const $propsGrid  = document.getElementById('propsGrid');

  function setUnit(unit) {
    currentUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    $inputUnit.textContent = unit === 'C' ? '°C' : unit === 'K' ? 'K' : '°F';
  }

  function setPUnit(unit) {
    currentPUnit = unit;
    document.querySelectorAll('.punit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.punit === unit);
    });
    $pUnitLabel.textContent = unit;
  }

  function showError(msg) {
    $error.textContent = msg;
    $error.style.display = 'block';
  }
  function clearError() {
    $error.style.display = 'none';
    $error.textContent   = '';
  }

  function phaseLabel(ph) {
    const map = {
      water: { cls: 'phase-water', key: 'phase.water' },
      steam: { cls: 'phase-steam', key: 'phase.steam' },
      ice:   { cls: 'phase-ice',   key: 'phase.ice' },
    };
    const m = map[ph] || map.water;
    return { cls: m.cls, txt: I18n.t(m.key) };
  }

  function renderProps(props) {
    $propsGrid.innerHTML = '';
    props.forEach((p, i) => {
      const cell = document.createElement('div');
      cell.className = 'prop-cell';
      cell.style.animationDelay = `${i * 30}ms`;
      cell.innerHTML = `
        <div class="prop-cell-top">
          <span class="prop-num">${p.id}</span>
          <span class="prop-symbol">${p.symbol}</span>
        </div>
        <div class="prop-name">${p.name}</div>
        <div class="prop-value-wrap">
          <div class="prop-value">${p.value}</div>
          <div class="prop-unit">${p.unit}</div>
        </div>`;
      $propsGrid.appendChild(cell);
    });
  }

  function renderForT(T, rawInput, pMPa, pRaw, pUnit) {
    let dispHTML = `<b>${T.toFixed(2)} °C</b>`;
    if (currentUnit === 'K')
      dispHTML = `<b>${rawInput.toFixed(2)} K</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;
    if (currentUnit === 'F')
      dispHTML = `<b>${rawInput.toFixed(2)} °F</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;
    $tempDisp.innerHTML = dispHTML;

    if ($pressDisp) {
      $pressDisp.innerHTML = `<span class="rp-label">${I18n.t('results.pressureLabel')}:</span> <b>${pRaw} ${pUnit}</b>`
        + (pUnit !== 'MPa' ? ` <span class="rp-aux">(${pMPa.toFixed(4)} MPa)</span>` : '');
    }

    const ph = Water.phase(T, pMPa);
    const { cls, txt } = phaseLabel(ph);
    $phaseTag.className = `phase-tag ${cls}`;
    $phaseTag.textContent = txt;

    if ($tsatDisp) {
      const tsat = Water.saturationTemp(pMPa);
      $tsatDisp.innerHTML = `<span class="rp-label">${I18n.t('results.tsatLabel')}:</span> `
        + `<b class="tsat-value" title="${I18n.t('results.tsatHint')}" data-tsat-c="${tsat}">${tsat.toFixed(2)} °C</b>`;
    }

    if ($tmeltDisp) {
      const tmelt = Water.meltingTemp(pMPa);
      $tmeltDisp.innerHTML = `<span class="rp-label">${I18n.t('results.tmeltLabel')}:</span> `
        + `<b class="tmelt-value" title="${I18n.t('results.tmeltHint')}" data-t-c="${tmelt}">${tmelt.toFixed(2)} °C</b>`;
    }

    renderProps(Water.getProperties(T, pMPa));
    renderChart();
  }

  function calculate() {
    clearError();

    const raw = parseFloat($input.value.replace(',', '.'));

    if (isNaN(raw)) {
      showError(I18n.t('err.notNumber'));
      return;
    }

    // Pressure input — optional, defaults to atmospheric
    let pRawStr = $pInput.value.trim().replace(',', '.');
    let pRaw = pRawStr === '' ? null : parseFloat(pRawStr);
    let pMPa;
    if (pRaw === null) {
      pMPa = Water.P_ATM_MPA;
      pRaw = pMPa;
    } else {
      if (isNaN(pRaw)) { showError(I18n.t('err.notNumber')); return; }
      pMPa = Water.toMPa(pRaw, currentPUnit);
      if (pMPa < 0.001 || pMPa > 100) {
        showError(I18n.t('err.outOfPressure', { val: pRaw + ' ' + currentPUnit }));
        return;
      }
    }

    const T = Water.toCelsius(raw, currentUnit);

    if (T < -100 || T > 800) {
      const range = currentUnit === 'C' ? '−100 – 800 °C'
                  : currentUnit === 'K' ? '173.15 – 1073.15 K'
                  : '−148 – 1472 °F';
      showError(I18n.t('err.outOfRange', { val: raw, range }));
      return;
    }

    lastT = { T, raw, pMPa, pRaw, pUnit: currentPUnit };
    renderForT(T, raw, pMPa, pRaw, currentPUnit);
    pushHistory({ raw, unit: currentUnit, T, pRaw, pUnit: currentPUnit, pMPa, ts: Date.now() });

    $results.style.display = 'block';
    $results.classList.remove('animate-in');
    void $results.offsetWidth;
    $results.classList.add('animate-in');

    requestAnimationFrame(() => {
      $results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ─── Property chart ────────────────────────────────────
  const CHART_PROPS = [
    { key: 'rho',    sym: 'ρ',  tkey: 'prop.density', ukey: 'unit.density' },
    { key: 'cp',     sym: 'cₚ', tkey: 'prop.cp',      ukey: 'unit.cp' },
    { key: 'lambda', sym: 'λ',  tkey: 'prop.lambda',  ukey: 'unit.lambda' },
    { key: 'mu',     sym: 'μ',  tkey: 'prop.mu',      ukey: 'unit.mu' },
    { key: 'nu',     sym: 'ν',  tkey: 'prop.nu',      ukey: 'unit.nu' },
    { key: 'a',      sym: 'a',  tkey: 'prop.a',       ukey: 'unit.a' },
    { key: 'Pr',     sym: 'Pr', tkey: 'prop.Pr',      ukey: 'unit.Pr' },
    { key: 'beta',   sym: 'β',  tkey: 'prop.beta',    ukey: 'unit.beta' },
    { key: 'h',      sym: 'h',  tkey: 'prop.h',       ukey: 'unit.h' },
  ];
  let currentChartProp = 'rho';
  let chartState = null;

  function linearTicks(min, max, n) {
    const span = max - min;
    if (span <= 0) return [min];
    const raw = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step = 10 * mag;
    if (norm < 1.5) step = mag;
    else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  function logTicks(min, max) {
    const ticks = [];
    const e0 = Math.floor(Math.log10(Math.max(min, 1e-12)));
    const e1 = Math.ceil(Math.log10(max));
    for (let e = e0; e <= e1; e++) {
      const v = Math.pow(10, e);
      if (v >= min * 0.999 && v <= max * 1.001) ticks.push(v);
    }
    return ticks;
  }

  function fmtTick(v) {
    const a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 10000 || a < 0.01) return v.toExponential(0).replace('+', '');
    if (a >= 100) return v.toFixed(0);
    if (a >= 10)  return v.toFixed(1);
    if (a >= 1)   return v.toFixed(2);
    return v.toPrecision(2);
  }

  function setupChart() {
    const sel = document.getElementById('chartPropSelect');
    if (!sel) return;
    function fillOptions() {
      const cur = sel.value || currentChartProp;
      sel.innerHTML = CHART_PROPS.map(p =>
        `<option value="${p.key}">${p.sym} — ${I18n.t(p.tkey)}</option>`
      ).join('');
      sel.value = cur;
      currentChartProp = sel.value;
    }
    fillOptions();
    sel.addEventListener('change', () => {
      currentChartProp = sel.value;
      renderChart();
    });
    I18n.onChange(() => { fillOptions(); renderChart(); });

    const exportBtn = document.getElementById('chartExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportChartPng);
  }

  function exportChartPng() {
    const wrap = document.getElementById('chartWrap');
    const svg = wrap && wrap.querySelector('svg');
    const st = chartState;
    if (!svg || !st) return;

    const clone = svg.cloneNode(true);
    const srcEls = [svg, ...svg.querySelectorAll('*')];
    const dstEls = [clone, ...clone.querySelectorAll('*')];
    const props = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity',
      'fill-opacity', 'opacity',
      'font-family', 'font-size', 'font-weight', 'text-anchor'
    ];
    for (let i = 0; i < srcEls.length; i++) {
      const cs = getComputedStyle(srcEls[i]);
      let style = '';
      for (const p of props) {
        const v = cs.getPropertyValue(p);
        if (v) style += `${p}:${v};`;
      }
      dstEls[i].setAttribute('style', style);
    }

    clone.querySelectorAll('.chart-hover, .chart-overlay').forEach(el => el.remove());

    const bodyCs = getComputedStyle(document.body);
    const bg = (bodyCs.getPropertyValue('--surface') || bodyCs.backgroundColor || '#ffffff').trim() || '#ffffff';

    const W = st.W, H = st.H, scale = 2;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width',  W * scale);
    clone.setAttribute('height', H * scale);
    clone.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const bgRect = document.createElementNS(SVG_NS, 'rect');
    bgRect.setAttribute('x', 0);
    bgRect.setAttribute('y', 0);
    bgRect.setAttribute('width',  W);
    bgRect.setAttribute('height', H);
    bgRect.setAttribute('fill', bg);
    clone.insertBefore(bgRect, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n', xml],
      { type: 'image/svg+xml;charset=utf-8' }
    );
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, W * scale, H * scale);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fname = `H2O_${st.meta.key}_${st.pMPa.toFixed(3)}MPa_${stamp}.png`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.error('Failed to render SVG to image for PNG export');
    };
    img.src = url;
  }

  function renderChart() {
    const wrap = document.getElementById('chartWrap');
    const section = document.getElementById('chartSection');
    if (!wrap || !section) return;
    if (!lastT) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const prop = currentChartProp;
    const meta = CHART_PROPS.find(p => p.key === prop) || CHART_PROPS[0];
    const pMPa = lastT.pMPa;
    const Tsat = Water.saturationTemp(pMPa);

    const W = 720, H = 320, PL = 64, PR = 18, PT = 22, PB = 44;
    const PW = W - PL - PR, PH = H - PT - PB;
    const Tmin = -100, Tmax = 800, N = 360;

    const ice = [], liq = [], stm = [];
    for (let i = 0; i <= N; i++) {
      const T = Tmin + (Tmax - Tmin) * i / N;
      let d;
      try {
        const ph = Water.phase(T, pMPa);
        d = (ph === 'ice')   ? Water.computeIce(T, pMPa)
          : (ph === 'steam') ? Water.computeSteam(T, pMPa)
                             : Water.compute(T, pMPa);
        const v = d[prop];
        if (!isFinite(v) || v == null) continue;
        const arr = (ph === 'ice') ? ice : (ph === 'steam') ? stm : liq;
        arr.push([T, v]);
      } catch (e) { /* skip */ }
    }
    const allV = ice.concat(liq).concat(stm).map(p => p[1]);
    if (allV.length < 2) { wrap.innerHTML = ''; return; }

    let vmin = Math.min(...allV), vmax = Math.max(...allV);
    if (vmin === vmax) { vmin -= 1; vmax += 1; }
    const useLog = vmin > 0 && vmax / Math.max(vmin, 1e-12) > 50;
    if (!useLog) {
      const span = vmax - vmin;
      vmin -= span * 0.05; vmax += span * 0.05;
    }

    const tx = T => PL + (T - Tmin) / (Tmax - Tmin) * PW;
    const ty = v => {
      if (useLog) {
        const lmin = Math.log10(Math.max(vmin, 1e-12));
        const lmax = Math.log10(vmax);
        return PT + PH - (Math.log10(Math.max(v, 1e-12)) - lmin) / (lmax - lmin) * PH;
      }
      return PT + PH - (v - vmin) / (vmax - vmin) * PH;
    };
    const path = pts => pts.map((p, i) =>
      (i ? 'L' : 'M') + tx(p[0]).toFixed(1) + ',' + ty(p[1]).toFixed(1)
    ).join(' ');

    const xticks = [-100, -50, 0, 100, 200, 300, 400, 500, 600, 700, 800].filter(t => t >= Tmin && t <= Tmax);
    const yticks = useLog ? logTicks(vmin, vmax) : linearTicks(vmin, vmax, 5);

    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">`;
    s += `<rect x="${PL}" y="${PT}" width="${PW}" height="${PH}" class="chart-plot"/>`;
    xticks.forEach(t => {
      const x = tx(t).toFixed(1);
      s += `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT + PH}" class="chart-grid"/>`;
      s += `<text x="${x}" y="${PT + PH + 16}" class="chart-tick" text-anchor="middle">${t}</text>`;
    });
    yticks.forEach(v => {
      const y = ty(v).toFixed(1);
      s += `<line x1="${PL}" y1="${y}" x2="${PL + PW}" y2="${y}" class="chart-grid"/>`;
      s += `<text x="${PL - 6}" y="${y + 3}" class="chart-tick" text-anchor="end">${fmtTick(v)}</text>`;
    });
    if (Tsat >= Tmin && Tsat <= Tmax) {
      const xs = tx(Tsat).toFixed(1);
      s += `<line x1="${xs}" y1="${PT}" x2="${xs}" y2="${PT + PH}" class="chart-tsat"/>`;
      s += `<text x="${xs}" y="${PT - 6}" class="chart-tsat-label" text-anchor="middle">Tₛ ${Tsat.toFixed(1)}°C</text>`;
    }
    if (lastT.T >= Tmin && lastT.T <= Tmax) {
      const xc = tx(lastT.T).toFixed(1);
      s += `<line x1="${xc}" y1="${PT}" x2="${xc}" y2="${PT + PH}" class="chart-cur"/>`;
    }
    if (ice.length > 1) s += `<path d="${path(ice)}" class="chart-ice"/>`;
    if (liq.length > 1) s += `<path d="${path(liq)}" class="chart-liquid"/>`;
    if (stm.length > 1) s += `<path d="${path(stm)}" class="chart-steam"/>`;
    s += `<text x="${PL + PW / 2}" y="${H - 8}" class="chart-axis" text-anchor="middle">T, °C</text>`;
    const ylab = `${meta.sym}, ${I18n.t(meta.ukey)}${useLog ? ' (log)' : ''}`;
    s += `<text x="${PL}" y="${PT - 8}" class="chart-axis">${ylab}</text>`;
    s += `<g class="chart-hover" style="display:none">`
      + `<line class="chart-hover-line" y1="${PT}" y2="${PT + PH}"/>`
      + `<circle class="chart-hover-dot" r="4"/>`
      + `</g>`;
    s += `<rect class="chart-overlay" x="${PL}" y="${PT}" width="${PW}" height="${PH}" fill="transparent"/>`;
    s += `</svg>`;
    s += `<div class="chart-tooltip" role="tooltip"></div>`;

    wrap.innerHTML = s;

    chartState = {
      ice, liq, stm, vmin, vmax, useLog,
      Tmin, Tmax, W, H, PL, PT, PW, PH,
      meta, Tsat, pMPa
    };
    attachChartHover();
  }

  function tyFromState(st, v) {
    if (st.useLog) {
      const lmin = Math.log10(Math.max(st.vmin, 1e-12));
      const lmax = Math.log10(st.vmax);
      return st.PT + st.PH - (Math.log10(Math.max(v, 1e-12)) - lmin) / (lmax - lmin) * st.PH;
    }
    return st.PT + st.PH - (v - st.vmin) / (st.vmax - st.vmin) * st.PH;
  }

  function fmtTooltipVal(v) {
    const a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 10000 || a < 0.001) return v.toExponential(3);
    if (a >= 1000) return v.toFixed(1);
    if (a >= 10)   return v.toFixed(2);
    if (a >= 1)    return v.toFixed(3);
    return v.toPrecision(4);
  }

  function attachChartHover() {
    const wrap = document.getElementById('chartWrap');
    if (!wrap) return;
    const svg = wrap.querySelector('svg');
    const overlay = svg && svg.querySelector('.chart-overlay');
    const hoverG = svg && svg.querySelector('.chart-hover');
    const hoverLine = svg && svg.querySelector('.chart-hover-line');
    const hoverDot = svg && svg.querySelector('.chart-hover-dot');
    const tooltip = wrap.querySelector('.chart-tooltip');
    if (!overlay || !hoverG || !tooltip) return;

    function svgPointFromEvent(evt) {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }

    function onMove(evt) {
      const st = chartState;
      if (!st) return;
      const p = svgPointFromEvent(evt);
      if (!p) return;
      const T = st.Tmin + (p.x - st.PL) / st.PW * (st.Tmax - st.Tmin);
      let best = null, bestDist = Infinity, bestPhase = null;
      for (const pt of (st.ice || [])) {
        const d = Math.abs(pt[0] - T);
        if (d < bestDist) { bestDist = d; best = pt; bestPhase = 'ice'; }
      }
      for (const pt of st.liq) {
        const d = Math.abs(pt[0] - T);
        if (d < bestDist) { bestDist = d; best = pt; bestPhase = 'liquid'; }
      }
      for (const pt of st.stm) {
        const d = Math.abs(pt[0] - T);
        if (d < bestDist) { bestDist = d; best = pt; bestPhase = 'steam'; }
      }
      if (!best) return;

      const x = st.PL + (best[0] - st.Tmin) / (st.Tmax - st.Tmin) * st.PW;
      const y = tyFromState(st, best[1]);

      hoverG.style.display = '';
      hoverLine.setAttribute('x1', x.toFixed(1));
      hoverLine.setAttribute('x2', x.toFixed(1));
      hoverDot.setAttribute('cx', x.toFixed(1));
      hoverDot.setAttribute('cy', y.toFixed(1));
      hoverDot.setAttribute('class', 'chart-hover-dot ' + bestPhase);

      // Position tooltip in wrap-relative coordinates
      const wrapRect = wrap.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const sx = svgRect.left + (x / st.W) * svgRect.width;
      const sy = svgRect.top + (y / st.H) * svgRect.height;
      let left = sx - wrapRect.left;
      let top  = sy - wrapRect.top;
      // Clamp horizontally so it doesn't escape the wrap
      const ttRect = tooltip.getBoundingClientRect();
      const halfW = (ttRect.width || 120) / 2;
      const minL = halfW + 4, maxL = wrapRect.width - halfW - 4;
      if (left < minL) left = minL;
      if (left > maxL) left = maxL;
      if (top < ttRect.height + 14) top = ttRect.height + 14; // flip below if too high

      tooltip.style.left = left + 'px';
      tooltip.style.top  = top  + 'px';
      const unit = I18n.t(st.meta.ukey);
      const phaseKey = bestPhase === 'steam' ? 'phase.steam'
                     : bestPhase === 'ice'   ? 'phase.ice'
                     : 'phase.water';
      tooltip.innerHTML =
        `<div class="ct-row"><span class="ct-key">T</span>`
          + `<span class="ct-val">${best[0].toFixed(1)}</span>`
          + `<span class="ct-unit">°C</span></div>`
        + `<div class="ct-row"><span class="ct-key">${st.meta.sym}</span>`
          + `<span class="ct-val">${fmtTooltipVal(best[1])}</span>`
          + `<span class="ct-unit">${unit}</span></div>`
        + `<div class="ct-phase ${bestPhase}">${I18n.t(phaseKey)}</div>`;
      tooltip.classList.add('visible');
    }

    function onLeave() {
      hoverG.style.display = 'none';
      tooltip.classList.remove('visible');
    }

    overlay.addEventListener('mousemove', onMove);
    overlay.addEventListener('mouseleave', onLeave);
    overlay.addEventListener('touchstart', (e) => { if (e.touches[0]) onMove(e.touches[0]); }, { passive: true });
    overlay.addEventListener('touchmove',  (e) => { if (e.touches[0]) onMove(e.touches[0]); }, { passive: true });
    overlay.addEventListener('touchend',   onLeave);
  }

  function setupThemeSwitch() {
    const btns = document.querySelectorAll('#themeSwitch .theme-btn');
    function syncActive() {
      const cur = document.documentElement.getAttribute('data-theme') || 'auto';
      btns.forEach(b => b.classList.toggle('active', b.dataset.themeSet === cur));
    }
    function syncTitles() {
      const map = { light: 'theme.light', auto: 'theme.auto', dark: 'theme.dark' };
      btns.forEach(b => {
        const k = map[b.dataset.themeSet];
        if (k) b.title = I18n.t(k);
      });
    }
    btns.forEach(b => {
      b.addEventListener('click', () => {
        const t = b.dataset.themeSet;
        try { localStorage.setItem('theme', t); } catch (e) {}
        document.documentElement.setAttribute('data-theme', t);
        syncActive();
      });
    });
    I18n.onChange(syncTitles);
    syncActive();
    syncTitles();
  }

  function setupLangSwitch() {
    const btns = document.querySelectorAll('#langSwitch .lang-btn');
    function syncActive() {
      const cur = I18n.get();
      btns.forEach(b => b.classList.toggle('active', b.dataset.lang === cur));
    }
    btns.forEach(b => {
      b.addEventListener('click', () => I18n.setLang(b.dataset.lang));
    });
    I18n.onChange(() => {
      syncActive();
      if (lastT) renderForT(lastT.T, lastT.raw);
    });
    syncActive();
  }

  function csvEscape(v) {
    const s = String(v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildExportContext() {
    if (!lastT) return null;
    const props = Water.getProperties(lastT.T, lastT.pMPa);
    const ph = Water.phase(lastT.T, lastT.pMPa);
    const phaseTxt = phaseLabel(ph).txt;
    const tempStr = lastT.raw.toFixed(2) + ' '
      + (currentUnit === 'C' ? '°C' : currentUnit === 'K' ? 'K' : '°F')
      + (currentUnit !== 'C' ? ' (' + lastT.T.toFixed(2) + ' °C)' : '');
    const pressStr = lastT.pRaw + ' ' + lastT.pUnit
      + (lastT.pUnit !== 'MPa' ? ' (' + lastT.pMPa.toFixed(4) + ' MPa)' : '');
    const tsatStr  = Water.saturationTemp(lastT.pMPa).toFixed(2) + ' °C';
    const tmeltStr = Water.meltingTemp(lastT.pMPa).toFixed(2)   + ' °C';
    return { props, phaseTxt, tempStr, pressStr, tsatStr, tmeltStr };
  }

  function exportCsv() {
    const ctx = buildExportContext();
    if (!ctx) return;
    const sep = ',';
    const lines = [];
    lines.push([I18n.t('export.tempLabel'), ctx.tempStr].map(csvEscape).join(sep));
    lines.push([I18n.t('results.pressureLabel'), ctx.pressStr].map(csvEscape).join(sep));
    lines.push([I18n.t('results.tsatLabel'),  ctx.tsatStr ].map(csvEscape).join(sep));
    lines.push([I18n.t('results.tmeltLabel'), ctx.tmeltStr].map(csvEscape).join(sep));
    lines.push([I18n.t('export.phaseLabel'),  ctx.phaseTxt].map(csvEscape).join(sep));
    lines.push([I18n.t('export.generated'), new Date().toISOString()].map(csvEscape).join(sep));
    lines.push('');
    lines.push([
      I18n.t('export.headerProp'),
      I18n.t('export.headerSymbol'),
      I18n.t('export.headerValue'),
      I18n.t('export.headerUnit'),
    ].map(csvEscape).join(sep));
    ctx.props.forEach(p => {
      lines.push([p.name, p.symbol, p.value, p.unit].map(csvEscape).join(sep));
    });
    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'h2o-properties_' + lastT.raw.toFixed(2) + currentUnit + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportPdf() {
    const ctx = buildExportContext();
    if (!ctx) return;
    const lang = I18n.get();
    const ver = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '';
    const rows = ctx.props.map(p => `
      <tr>
        <td>${p.name}</td>
        <td class="sym">${p.symbol}</td>
        <td class="val">${p.value}</td>
        <td class="u">${p.unit}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8">
<title>${I18n.t('meta.title')}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color:#111; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color:#555; font-size: 13px; margin-bottom: 18px; }
  .meta { margin: 14px 0 18px; font-size: 14px; }
  .meta b { display:inline-block; min-width: 110px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left; }
  th { background:#f4f5f8; font-weight:600; }
  td.val { font-family: "DM Mono", Menlo, monospace; text-align: right; }
  td.sym { font-family: "DM Mono", Menlo, monospace; color:#2563eb; }
  td.u { color:#666; }
  footer { margin-top: 24px; font-size: 11px; color:#888; }
</style></head><body>
<h1>${I18n.t('hero.title1')} ${I18n.t('hero.title2')}</h1>
<div class="sub">IAPWS-IF97 · 101.325 kPa</div>
<div class="meta">
  <div><b>${I18n.t('export.tempLabel')}:</b> ${ctx.tempStr}</div>
  <div><b>${I18n.t('results.pressureLabel')}:</b> ${ctx.pressStr}</div>
  <div><b>${I18n.t('results.tsatLabel')}:</b> ${ctx.tsatStr}</div>
  <div><b>${I18n.t('results.tmeltLabel')}:</b> ${ctx.tmeltStr}</div>
  <div><b>${I18n.t('export.phaseLabel')}:</b> ${ctx.phaseTxt}</div>
  <div><b>${I18n.t('export.generated')}:</b> ${new Date().toLocaleString(lang)}</div>
</div>
<table>
  <thead><tr>
    <th>${I18n.t('export.headerProp')}</th>
    <th>${I18n.t('export.headerSymbol')}</th>
    <th style="text-align:right">${I18n.t('export.headerValue')}</th>
    <th>${I18n.t('export.headerUnit')}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<footer>H₂O Thermo Calc · ${I18n.t('footer.version')} ${ver}</footer>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 150); };<\/script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      history = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(history)) history = [];
    } catch (_) { history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (_) {}
  }

  function pushHistory(entry) {
    history = history.filter(e => !(
      e.raw === entry.raw && e.unit === entry.unit &&
      e.pRaw === entry.pRaw && e.pUnit === entry.pUnit
    ));
    history.unshift(entry);
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
    saveHistory();
    renderHistory();
  }

  function clearHistory() {
    history = [];
    saveHistory();
    renderHistory();
  }

  function unitSymbol(u) {
    return u === 'C' ? '°C' : u === 'K' ? 'K' : '°F';
  }

  function renderHistory() {
    const $card = document.getElementById('historyCard');
    const $list = document.getElementById('historyList');
    if (!history.length) {
      $card.style.display = 'none';
      return;
    }
    $card.style.display = 'block';
    $list.innerHTML = '';
    history.forEach(e => {
      const chip = document.createElement('button');
      chip.className = 'history-chip';
      chip.title = new Date(e.ts).toLocaleString(I18n.get());
      const pPart = (e.pRaw != null && e.pUnit)
        ? `<span class="hc-sep">·</span><span class="hc-val">${e.pRaw}</span><span class="hc-unit">${e.pUnit}</span>`
        : '';
      chip.innerHTML = `<span class="hc-val">${e.raw}</span><span class="hc-unit">${unitSymbol(e.unit)}</span>${pPart}`;
      chip.addEventListener('click', () => {
        setUnit(e.unit);
        $input.value = e.raw;
        if (e.pRaw != null && e.pUnit) {
          setPUnit(e.pUnit);
          $pInput.value = e.pRaw;
        }
        calculate();
      });
      $list.appendChild(chip);
    });
  }

  function init() {
    I18n.init();
    setupLangSwitch();
    setupThemeSwitch();
    setupChart();
    loadHistory();
    renderHistory();

    const verEl = document.getElementById('appVersion');
    if (verEl && typeof APP_VERSION !== 'undefined') verEl.textContent = APP_VERSION;

    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => setUnit(btn.dataset.unit));
    });
    document.querySelectorAll('.punit-btn').forEach(btn => {
      btn.addEventListener('click', () => setPUnit(btn.dataset.punit));
    });

    $pInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });

    document.getElementById('calcBtn').addEventListener('click', calculate);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
    document.getElementById('historyClearBtn').addEventListener('click', clearHistory);
    I18n.onChange(() => renderHistory());

    $input.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });

    $input.focus();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
