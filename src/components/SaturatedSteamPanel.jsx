import { useState } from "react";
import { useI18n } from "../hooks/useI18n";
import { useHistory } from "../hooks/useHistory";
import { Water, fmt, toCelsius, toMPa } from "../utils/water";

function ResultCard({ id, symbol, label, value, unit, index }) {
  return (
    <div className="prop-cell" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="prop-cell-top">
        <span className="prop-num">{id}</span>
        <span className="prop-symbol">{symbol}</span>
      </div>
      <div className="prop-name">{label}</div>
      <div className="prop-value-wrap">
        <div className="prop-value">{value}</div>
        <div className="prop-unit">{unit}</div>
      </div>
    </div>
  );
}

export default function SaturatedSteamPanel() {
  const { t } = useI18n();
  const [tempInput, setTempInput] = useState("100");
  const [pressureInput, setPressureInput] = useState("0.101325");
  const [tempUnit, setTempUnit] = useState("C");
  const [pressureUnit, setPressureUnit] = useState("MPa");
  const [mode, setMode] = useState("temp");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const { history, addToHistory, clearHistory } = useHistory("h2o.satHistory");

  const applyResult = (next, entry) => {
    setResult(next);
    addToHistory({
      ...entry,
      TsatC: next.TsatC,
      pMPa: next.pMPa,
      timestamp: Date.now(),
    });
  };

  const calcByTemp = () => {
    setError("");
    const raw = parseFloat(tempInput.replace(",", "."));
    if (Number.isNaN(raw)) {
      setError(t("err.notNumber"));
      return;
    }
    const T = toCelsius(raw, tempUnit);
    if (T < 0.01 || T > 370) {
      setError(t("sat.err.tempRange"));
      return;
    }
    applyResult(Water.saturatedSteamByTemp(T), {
      mode: "temp",
      raw,
      unit: tempUnit,
    });
  };

  const calcByPressure = () => {
    setError("");
    const raw = parseFloat(pressureInput.replace(",", "."));
    if (Number.isNaN(raw)) {
      setError(t("err.notNumber"));
      return;
    }
    const pMPa = toMPa(raw, pressureUnit);
    if (pMPa < 0.001 || pMPa > 22.064) {
      setError(t("sat.err.pressureRange"));
      return;
    }
    applyResult(Water.saturatedSteamByPressure(pMPa), {
      mode: "pressure",
      raw,
      unit: pressureUnit,
    });
  };

  const tempUnitLabel = tempUnit === "C" ? "°C" : tempUnit === "K" ? "K" : "°F";
  const resultCards = result
    ? [
        { id: "01", symbol: "T", label: t("results.tsatLabel"), value: fmt(result.TsatC, 3), unit: "°C" },
        { id: "02", symbol: "p", label: t("results.pressureLabel"), value: fmt(result.pMPa, 6), unit: "MPa" },
        { id: "03", symbol: "ρg", label: t("sat.rho_g"), value: fmt(result.rho_g, 5), unit: t("unit.density") },
        { id: "04", symbol: "vg", label: t("sat.v_g"), value: fmt(result.v_g, 5), unit: t("unit.v") },
        { id: "05", symbol: "hg", label: t("sat.h_g"), value: fmt(result.h_g, 3), unit: t("unit.h") },
        { id: "06", symbol: "hfg", label: t("sat.h_fg"), value: fmt(result.h_fg, 3), unit: t("unit.hfg") },
        { id: "07", symbol: "cpg", label: t("sat.cp_g"), value: fmt(result.cp_g, 2), unit: t("unit.cp") },
        { id: "08", symbol: "μg", label: t("sat.mu_g"), value: fmt(result.mu_g, 7), unit: t("unit.mu") },
        { id: "09", symbol: "λg", label: t("sat.lambda_g"), value: fmt(result.lambda_g, 5), unit: t("unit.lambda") },
        { id: "10", symbol: "x", label: t("sat.x"), value: fmt(result.x, 3), unit: "-" },
      ]
    : [];

  const restoreHistoryItem = (item) => {
    setMode(item.mode);
    setError("");
    if (item.mode === "temp") {
      setTempUnit(item.unit);
      setTempInput(String(item.raw));
      setResult(Water.saturatedSteamByTemp(item.TsatC));
      return;
    }
    setPressureUnit(item.unit);
    setPressureInput(String(item.raw));
    setResult(Water.saturatedSteamByPressure(item.pMPa));
  };

  return (
    <>
      <section className="sat-card animate-in">
      <div className="sat-head">
        <h3 className="sat-title">{t("sat.title")}</h3>
        <div className="sat-mode">
          <button
            type="button"
            className={`sat-mode-btn ${mode === "temp" ? "active" : ""}`}
            onClick={() => setMode("temp")}
          >
            {t("sat.tabByTemp")}
          </button>
          <button
            type="button"
            className={`sat-mode-btn ${mode === "pressure" ? "active" : ""}`}
            onClick={() => setMode("pressure")}
          >
            {t("sat.tabByPressure")}
          </button>
        </div>
      </div>

      {mode === "temp" ? (
        <div className="sat-body">
          <div className="input-row sat-input-row">
            <div>
              <label className="field-label" htmlFor="satTempInput">
                {t("sat.inputTemp")}
              </label>
              <div className="input-group">
                <input
                  id="satTempInput"
                  className="temp-input"
                  type="number"
                  step="0.1"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && calcByTemp()}
                />
                <span className="input-unit">{tempUnitLabel}</span>
              </div>
            </div>
            <div>
              <label className="field-label">{t("input.unitsLabel")}</label>
              <div className="unit-toggle">
                {["C", "K", "F"].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={`unit-btn ${tempUnit === unit ? "active" : ""}`}
                    onClick={() => setTempUnit(unit)}
                    data-unit={unit}
                  >
                    {unit === "C" ? "°C" : unit === "K" ? "K" : "°F"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">&nbsp;</label>
              <button type="button" className="btn-calc" onClick={calcByTemp}>
                {t("sat.calcByTemp")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="sat-body">
          <div className="input-row sat-input-row">
            <div>
              <label className="field-label" htmlFor="satPressureInput">
                {t("sat.inputPressure")}
              </label>
              <div className="input-group">
                <input
                  id="satPressureInput"
                  className="temp-input"
                  type="number"
                  step="0.001"
                  value={pressureInput}
                  onChange={(e) => setPressureInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && calcByPressure()}
                />
                <span className="input-unit">{pressureUnit}</span>
              </div>
            </div>
            <div>
              <label className="field-label">{t("input.unitsLabel")}</label>
              <div className="unit-toggle">
                {["MPa", "kPa", "bar", "atm"].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={`punit-btn ${pressureUnit === unit ? "active" : ""}`}
                    onClick={() => setPressureUnit(unit)}
                    data-punit={unit}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">&nbsp;</label>
              <button type="button" className="btn-calc" onClick={calcByPressure}>
                {t("sat.calcByPressure")}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ display: "block" }}>
          {error}
        </div>
      )}
      </section>

      {result && (
        <div className="props-grid sat-props-grid">
          {resultCards.map((prop, index) => (
            <ResultCard key={prop.id} {...prop} index={index} />
          ))}
        </div>
      )}

      <section className="history-card sat-history-card">
        <div className="history-head">
          <div className="history-title">{t("history.title")}</div>
          {history.length > 0 && (
            <button type="button" className="history-clear" onClick={clearHistory}>
              {t("history.clear")}
            </button>
          )}
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <span className="hc-unit">{t("history.empty")}</span>
          ) : (
            history.map((item, idx) => (
              <button
                key={`${item.timestamp}-${idx}`}
                type="button"
                className="history-chip"
                onClick={() => restoreHistoryItem(item)}
              >
                <span className="hc-val">
                  {item.mode === "temp" ? "T" : "P"} = {fmt(item.raw, 2)} {item.unit}
                </span>
                <span className="hc-sep">·</span>
                <span className="hc-unit">
                  {fmt(item.TsatC, 2)} °C / {fmt(item.pMPa, 4)} MPa
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </>
  );
}
