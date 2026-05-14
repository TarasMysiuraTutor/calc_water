import { useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import InputCard from "./components/InputCard";
import PropsGrid from "./components/PropsGrid";
import PropertyChart from "./components/PropertyChart";
import SaturatedSteamPanel from "./components/SaturatedSteamPanel";
import Footer from "./components/Footer";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./context/I18nContext";
import { useI18n } from "./hooks/useI18n";
import { useHistory } from "./hooks/useHistory";
import { Water, fmt } from "./utils/water";

function CalculatorPage() {
  const { t } = useI18n();
  const { history, addToHistory, clearHistory } = useHistory();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("main");

  const handleCalculate = (payload) => {
    const phase = Water.phase(payload.T, payload.pMPa);
    const next = {
      ...payload,
      phase,
      tsat: Water.saturationTemp(payload.pMPa),
      tmelt: Water.meltingTemp(payload.pMPa),
    };
    setResult(next);
    addToHistory({
      raw: payload.raw,
      unit: payload.tempUnit,
      pRaw: payload.pRaw,
      pUnit: payload.pressureUnit,
      T: payload.T,
      pMPa: payload.pMPa,
      timestamp: payload.timestamp,
    });
  };

  const phaseClass = useMemo(() => {
    if (!result) return "";
    if (result.phase === "steam") return "phase-steam";
    if (result.phase === "ice") return "phase-ice";
    return "phase-water";
  }, [result]);

  return (
    <div className="page-wrap">
      <Header />
      <Hero />
      <main className="main-content">
        <div className="container">
          <div className="calc-tabs" role="tablist" aria-label={t("tabs.aria")}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "main"}
              className={`calc-tab-btn ${activeTab === "main" ? "active" : ""}`}
              onClick={() => setActiveTab("main")}
            >
              {t("tabs.main")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "sat"}
              className={`calc-tab-btn ${activeTab === "sat" ? "active" : ""}`}
              onClick={() => setActiveTab("sat")}
            >
              {t("tabs.sat")}
            </button>
          </div>

          {activeTab === "main" && <InputCard onCalculate={handleCalculate} />}

          {activeTab === "main" && result && (
            <section className="results-section animate-in" style={{ display: "block" }}>
              <div className="results-meta">
                <div>
                  <div className="results-temp">
                    T = <b>{fmt(result.T, 2)}</b> <span>°C</span>
                  </div>
                  <div className="results-pressure">
                    <span className="rp-label">{t("results.pressureLabel")}</span>
                    <b>
                      {fmt(result.pRaw, 4)} {result.pressureUnit}
                    </b>
                    <span className="rp-aux"> ({fmt(result.pMPa, 6)} MPa)</span>
                  </div>
                  <div className="results-tsat">
                    <span className="rp-label">{t("results.tsatLabel")}</span>
                    <span className="tsat-value" title={t("results.tsatHint")}>
                      {fmt(result.tsat, 2)} °C
                    </span>
                  </div>
                  <div className="results-tmelt">
                    <span className="rp-label">{t("results.tmeltLabel")}</span>
                    <span className="tmelt-value" title={t("results.tmeltHint")}>
                      {fmt(result.tmelt, 3)} °C
                    </span>
                  </div>
                </div>
                <span className={`phase-tag ${phaseClass}`}>{t(`phase.${result.phase}`)}</span>
              </div>

              <PropsGrid T={result.T} pMPa={result.pMPa} />
              <PropertyChart T={result.T} pMPa={result.pMPa} />
            </section>
          )}

          {activeTab === "sat" && <SaturatedSteamPanel />}

          {activeTab === "main" && (
          <section className="history-card">
            <div className="history-head">
              <div className="history-title">{t("history.title")}</div>
              {history.length > 0 && (
                <button className="history-clear" onClick={clearHistory}>
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
                    className="history-chip"
                    onClick={() =>
                      setResult({
                        ...item,
                        phase: Water.phase(item.T, item.pMPa),
                        tsat: Water.saturationTemp(item.pMPa),
                        tmelt: Water.meltingTemp(item.pMPa),
                        tempUnit: item.unit,
                        pressureUnit: item.pUnit,
                      })
                    }
                  >
                    <span className="hc-val">
                      {fmt(item.raw, 2)} {item.unit}
                    </span>
                    <span className="hc-sep">·</span>
                    <span className="hc-unit">
                      {fmt(item.pRaw, 4)} {item.pUnit}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <CalculatorPage />
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;