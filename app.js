/**
 * app.js — UI-логіка калькулятора теплофізичних властивостей рідин
 */

'use strict';

const App = (() => {

  let currentUnit      = 'C';
  let currentGroupKey  = 'water';
  let currentSubstKey  = 'water';

  // ── DOM refs ────────────────────────────────────────────
  const $input        = document.getElementById('tempInput');
  const $inputUnit    = document.getElementById('inputUnitLabel');
  const $error        = document.getElementById('errorBanner');
  const $results      = document.getElementById('resultsSection');
  const $tempDisp     = document.getElementById('tempDisplay');
  const $phaseTag     = document.getElementById('phaseTag');
  const $propsGrid    = document.getElementById('propsGrid');
  const $groupTabs    = document.getElementById('groupTabs');
  const $substSelect  = document.getElementById('substanceSelect');
  const $rangeNote    = document.getElementById('substanceRangeNote');

  // ── Build group tabs ─────────────────────────────────────
  function buildGroupTabs() {
    $groupTabs.innerHTML = '';
    Object.entries(SubstanceRegistry).forEach(([key, group]) => {
      const btn = document.createElement('button');
      btn.className = 'group-tab' + (key === currentGroupKey ? ' active' : '');
      btn.dataset.group = key;
      btn.innerHTML = `<span class="tab-icon">${group.icon}</span><span class="tab-label">${group.label}</span>`;
      btn.addEventListener('click', () => selectGroup(key));
      $groupTabs.appendChild(btn);
    });
  }

  // ── Build substance dropdown ─────────────────────────────
  function buildSubstanceSelect(groupKey) {
    const group = SubstanceRegistry[groupKey];
    $substSelect.innerHTML = '';
    Object.entries(group.substances).forEach(([key, sub]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = sub.name;
      $substSelect.appendChild(opt);
    });
    currentSubstKey = Object.keys(group.substances)[0];
    $substSelect.value = currentSubstKey;
    updateRangeNote();
  }

  function updateRangeNote() {
    const group = SubstanceRegistry[currentGroupKey];
    const sub   = group.substances[currentSubstKey];
    if (sub) {
      $rangeNote.textContent = `Діапазон: ${sub.note}`;
      $rangeNote.style.display = 'block';
    }
  }

  // ── Group selection ──────────────────────────────────────
  function selectGroup(key) {
    currentGroupKey = key;
    document.querySelectorAll('.group-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.group === key);
    });
    buildSubstanceSelect(key);
    // hide old results when group changes
    $results.style.display = 'none';
    clearError();
  }

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

  // ── Phase label (only for water) ──────────────────────────
  function phaseLabel(ph) {
    const map = {
      water: { cls: 'phase-water', txt: 'Рідка вода' },
      steam: { cls: 'phase-steam', txt: 'Перегріта рідина' },
      ice:   { cls: 'phase-ice',   txt: 'Лід' },
    };
    return map[ph] || map.water;
  }

  // ── Get temperature range for current substance ──────────
  function getRange() {
    const group = SubstanceRegistry[currentGroupKey];
    const sub   = group.substances[currentSubstKey];
    return sub ? sub.range : [0, 370];
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

    const [tMin, tMax] = getRange();
    if (T < tMin || T > tMax) {
      const toDisp = (tc) => {
        if (currentUnit === 'K') return `${(tc + 273.15).toFixed(2)} K`;
        if (currentUnit === 'F') return `${(tc * 9/5 + 32).toFixed(2)} °F`;
        return `${tc} °C`;
      };
      showError(`Значення виходить за межі допустимого діапазону (${toDisp(tMin)} – ${toDisp(tMax)}).`);
      return;
    }

    // Temperature display
    let dispHTML = `<b>${T.toFixed(2)} °C</b>`;
    if (currentUnit === 'K')
      dispHTML = `<b>${raw.toFixed(2)} K</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;
    if (currentUnit === 'F')
      dispHTML = `<b>${raw.toFixed(2)} °F</b> <span style="color:var(--ink-3);font-size:18px">(${T.toFixed(2)} °C)</span>`;
    $tempDisp.innerHTML = dispHTML;

    // Substance label in phase tag
    const group = SubstanceRegistry[currentGroupKey];
    const subName = group.substances[currentSubstKey].name;

    let props;

    if (currentGroupKey === 'water') {
      const ph = Water.phase(T);
      const { cls, txt } = phaseLabel(ph);
      $phaseTag.className   = `phase-tag ${cls}`;
      $phaseTag.textContent = txt;
      props = Water.getProperties(T);
    } else {
      $phaseTag.className   = 'phase-tag phase-substance';
      $phaseTag.textContent = subName;
      props = group.module.getProperties(currentSubstKey, T);
    }

    renderProps(props);

    $results.style.display = 'block';
    $results.classList.remove('animate-in');
    void $results.offsetWidth;
    $results.classList.add('animate-in');

    requestAnimationFrame(() => {
      $results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    buildGroupTabs();
    buildSubstanceSelect('water');

    // Substance select change
    $substSelect.addEventListener('change', () => {
      currentSubstKey = $substSelect.value;
      updateRangeNote();
      $results.style.display = 'none';
      clearError();
    });

    // Unit buttons
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => setUnit(btn.dataset.unit));
    });

    document.getElementById('calcBtn').addEventListener('click', calculate);
    $input.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
    $input.focus();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);