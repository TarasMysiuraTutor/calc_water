"use strict";

/*
 * app.js — UI-логіка
 * Працює з:
 *  - Water (physics)
 *  - Engine (logic: normal / saturation, r)
 */

let calcMode = "normal"; // "normal" | "saturation"

// ───────────────── DOM ─────────────────
const $tempInput = document.getElementById("tempInput");
const $calcBtn   = document.getElementById("calcBtn");
// const $out       = document.getElementById("output");
const $out = document.getElementById("propsGrid");

const $modeNormal = document.getElementById("modeNormal");
const $modeSat    = document.getElementById("modeSat");

const $resultsSection = document.getElementById("resultsSection");

// ───────────────── CORE ─────────────────
function calculate() {
  const rawT = parseFloat($tempInput.value.replace(",", "."));
  if (isNaN(rawT)) {
    renderError("Invalid temperature");
    return;
  }

  const pMPa = Water.P_ATM_MPA;

  const res = Engine.compute({
    mode: calcMode,
    T: rawT,
    pMPa
  });

  render(res);
  // ✅ ОЦЕ КЛЮЧОВЕ
  $resultsSection.style.display = "block";
}



// ───────────────── RENDER ─────────────────
function render(res) {
  if (!$out) return;

  $out.innerHTML = "";

  Object.entries(res.props).forEach(([key, val]) => {
    if (typeof val !== "number" || !isFinite(val)) return;

    const cell = document.createElement("div");
    cell.className = "prop-cell";

    cell.innerHTML = `
      <div class="prop-cell-top">
        <span class="prop-symbol">${key}</span>
      </div>
      <div class="prop-value-wrap">
        <div class="prop-value">${val.toFixed(3)}</div>
      </div>
    `;

    $out.appendChild(cell);
  });
}

function renderError(msg) {
  $out.innerHTML = `<div style="color:red">${msg}</div>`;
}

// ───────────────── UI HELPERS ─────────────────
function addLine(label, value) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${label}:</b> ${value}`;
  $out.appendChild(div);
}

function hr() {
  const h = document.createElement("hr");
  h.style.margin = "8px 0";
  return h;
}

// ───────────────── EVENTS ─────────────────
$calcBtn.addEventListener("click", calculate);

$tempInput.addEventListener("keydown", e => {
  if (e.key === "Enter") calculate();
});


// ───── Mode switch: normal / saturation ─────
document.querySelectorAll("#modeSwitch .mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    // UI: active class
    document.querySelectorAll("#modeSwitch .mode-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // logic
    calcMode = btn.dataset.mode; // "normal" | "saturation"

    calculate();
  });
});


// ───────────────── INIT ─────────────────
// document.addEventListener("DOMContentLoaded", () => {
//   $modeNormal.classList.add("active");
//   $tempInput.focus();
// });