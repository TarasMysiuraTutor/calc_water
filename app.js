/**
 * app.js — UI-логіка калькулятора теплофізичних властивостей води
 */

'use strict';

const App = (() => {

  let currentUnit = 'C';

  // ── DOM refs ────────────────────────────────────────────
  const $input      = document.getElementById('tempInput');
  const $inputUnit  = document.getElementById('inputUnitLabel');
  const $error      = document.getElementById('errorBanner');
  const $results    = document.getElementById('resultsSection');
  const $tempDisp   = document.getElementById('tempDisplay');
  const $phaseTag   = document.getElementById('phaseTag');
  const $propsGrid  = document.getElementById('propsGrid');

  // ── Unit toggle ─────────────────────────────────────────
  function setUnit(unit) {
    currentUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    $inputUnit.textContent = unit === 'C' ? '°C' : unit === 'K' ? 'K' : '°F';
  }

  // ── Error helpers ────────────────────────────────────────
  function showError(msg) {
    $error.textContent = msg;
    $error.style.display = 'block';
  }
  function clearError() {
    $error.style.display = 'none';
    $error.textContent   = '';
  }

  // ── Phase label ──────────────────────────────────────────
  function phaseLabel(ph) {
    const map = {
      water: { cls: 'phase-water', txt: 'Рідка вода' },
      steam: { cls: 'phase-steam', txt: 'Перегріта рідина' },
      ice:   { cls: 'phase-ice',   txt: 'Лід' },
    };
    return map[ph] || map.water;
  }

  // ── Render properties ────────────────────────────────────
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

  // ── Main calculate ───────────────────────────────────────
  function calculate() {
    clearError();

    const raw = parseFloat($input.value.replace(',', '.'));

    if (isNaN(raw)) {
      showError('Будь ласка, введіть числове значення температури.');
      return;
    }

    const T = Water.toCelsius(raw, currentUnit);

    if (T < 0 || T > 370) {
      const range = currentUnit === 'C' ? '0 – 370 °C'
                  : currentUnit === 'K' ? '273.15 – 643.15 K'
                  : '32 – 698 °F';
      showError(`Значення ${raw} виходить за межі допустимого діапазону (${range}).`);
      return;
    }

    // Temperature display string
    const Tk = T + 273.15;
    let dispHTML = `<b>${T.toFixed(2)} °C</b>`;
    if (currentUnit === 'K')
      dispHTML = `<b>${raw.toFixed(2)} K</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;
    if (currentUnit === 'F')
      dispHTML = `<b>${raw.toFixed(2)} °F</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;

    $tempDisp.innerHTML = dispHTML;

    // Phase
    const ph = Water.phase(T);
    const { cls, txt } = phaseLabel(ph);
    $phaseTag.className = `phase-tag ${cls}`;
    $phaseTag.textContent = txt;

    // Props
    const props = Water.getProperties(T);
    renderProps(props);

    // Show
    $results.style.display = 'block';
    $results.classList.remove('animate-in');
    void $results.offsetWidth; // reflow
    $results.classList.add('animate-in');

    // Scroll
    requestAnimationFrame(() => {
      $results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    // Unit buttons
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => setUnit(btn.dataset.unit));
    });

    // Calculate button
    document.getElementById('calcBtn').addEventListener('click', calculate);

    // Enter key
    $input.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });

    // Focus input
    $input.focus();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
