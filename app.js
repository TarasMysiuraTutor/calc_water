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

    renderProps(Water.getProperties(T, pMPa));
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

    if (T < 0 || T > 800) {
      const range = currentUnit === 'C' ? '0 – 800 °C'
                  : currentUnit === 'K' ? '273.15 – 1073.15 K'
                  : '32 – 1472 °F';
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
    return { props, phaseTxt, tempStr, pressStr };
  }

  function exportCsv() {
    const ctx = buildExportContext();
    if (!ctx) return;
    const sep = ',';
    const lines = [];
    lines.push([I18n.t('export.tempLabel'), ctx.tempStr].map(csvEscape).join(sep));
    lines.push([I18n.t('results.pressureLabel'), ctx.pressStr].map(csvEscape).join(sep));
    lines.push([I18n.t('export.phaseLabel'), ctx.phaseTxt].map(csvEscape).join(sep));
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
