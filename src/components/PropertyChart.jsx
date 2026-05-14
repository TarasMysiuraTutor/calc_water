import { useMemo, useState } from "react";
import { useI18n } from "../hooks/useI18n";
import { Water, fmt } from "../utils/water";

const CHART_W = 860;
const CHART_H = 360;
/** Більший лівий відступ, щоб підписи осі Y не обрізались при масштабуванні SVG */
const PAD_L = 68;
const PAD_R = 20;
const PAD_T = 24;
const PAD_B = 44;

const SERIES = [
  { key: "rho", labelKey: "prop.density", unitKey: "unit.density" },
  { key: "cp", labelKey: "prop.cp", unitKey: "unit.cp" },
  { key: "lambda", labelKey: "prop.lambda", unitKey: "unit.lambda" },
  { key: "mu", labelKey: "prop.mu", unitKey: "unit.mu" },
  { key: "nu", labelKey: "prop.nu", unitKey: "unit.nu" },
  { key: "Pr", labelKey: "prop.Pr", unitKey: "unit.Pr" },
];

function buildPath(points) {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export default function PropertyChart({ T, pMPa }) {
  const { t } = useI18n();
  const [propKey, setPropKey] = useState("rho");
  const [hoverIdx, setHoverIdx] = useState(-1);

  const chart = useMemo(() => {
    if (T == null || pMPa == null) return null;

    const xMin = -100;
    const xMax = 800;
    const steps = 120;
    const tsat = Water.saturationTemp(pMPa);
    const tmelt = Water.meltingTemp(pMPa);
    const xInner = CHART_W - PAD_L - PAD_R;
    const yInner = CHART_H - PAD_T - PAD_B;

    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const temp = xMin + ((xMax - xMin) * i) / steps;
      const phase = Water.phase(temp, pMPa);
      const raw =
        phase === "ice"
          ? Water.computeIce(temp, pMPa)
          : phase === "steam"
            ? Water.computeSteam(temp, pMPa)
            : Water.compute(temp, pMPa);
      const value = raw[propKey];
      if (Number.isFinite(value)) points.push({ temp, value, phase });
    }

    if (!points.length) return null;

    let yMin = Math.min(...points.map((p) => p.value));
    let yMax = Math.max(...points.map((p) => p.value));
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const pad = (yMax - yMin) * 0.08;
    yMin -= pad;
    yMax += pad;

    const sx = (temp) => PAD_L + ((temp - xMin) / (xMax - xMin)) * xInner;
    const sy = (val) => PAD_T + (1 - (val - yMin) / (yMax - yMin)) * yInner;

    const mapped = points.map((p) => ({ ...p, x: sx(p.temp), y: sy(p.value) }));
    const ice = mapped.filter((p) => p.phase === "ice");
    const liquid = mapped.filter((p) => p.phase === "water");
    const steam = mapped.filter((p) => p.phase === "steam");

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      tsat,
      tmelt,
      points: mapped,
      sx,
      sy,
      curX: sx(T),
      pathIce: buildPath(ice),
      pathLiquid: buildPath(liquid),
      pathSteam: buildPath(steam),
    };
  }, [T, pMPa, propKey]);

  if (!chart) return null;

  const activeMeta = SERIES.find((s) => s.key === propKey);
  const hoverPoint =
    hoverIdx >= 0 && hoverIdx < chart.points.length ? chart.points[hoverIdx] : null;
  const tooltipStyle = hoverPoint
    ? {
        left: `${hoverPoint.x}px`,
        top: `${hoverPoint.y}px`,
        marginLeft: hoverPoint.x > CHART_W - 220 ? "-12px" : "12px",
        transform:
          hoverPoint.x > CHART_W - 220
            ? `translate(-100%, ${hoverPoint.y < 90 ? "14px" : "-14px"})`
            : `translate(0, ${hoverPoint.y < 90 ? "14px" : "-14px"})`,
      }
    : undefined;

  const xTicks = [-100, 0, 100, 200, 300, 400, 500, 600, 700, 800];
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((k) => chart.yMin + (chart.yMax - chart.yMin) * k);

  return (
    <section className="chart-section animate-in">
      <div className="chart-head">
        <h3 className="chart-title">{t("chart.title")}</h3>
        <div className="chart-controls">
          <span>{t("chart.propLabel")}</span>
          <select
            className="chart-select"
            value={propKey}
            onChange={(e) => setPropKey(e.target.value)}
          >
            {SERIES.map((s) => (
              <option key={s.key} value={s.key}>
                {t(s.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-wrap">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
        >
          <rect
            className="chart-plot"
            x={PAD_L}
            y={PAD_T}
            width={CHART_W - PAD_L - PAD_R}
            height={CHART_H - PAD_T - PAD_B}
          />

          {xTicks.map((v) => {
            const x = chart.sx(v);
            return (
              <g key={`xt-${v}`}>
                <line className="chart-grid" x1={x} y1={PAD_T} x2={x} y2={CHART_H - PAD_B} />
                <text className="chart-tick" x={x} y={CHART_H - PAD_B + 16} textAnchor="middle">
                  {v}
                </text>
              </g>
            );
          })}

          {yTicks.map((v, idx) => {
            const y = chart.sy(v);
            return (
              <g key={`yt-${idx}`}>
                <line className="chart-grid" x1={PAD_L} y1={y} x2={CHART_W - PAD_R} y2={y} />
                <text className="chart-tick" x={PAD_L - 6} y={y + 4} textAnchor="end">
                  {fmt(v, 2)}
                </text>
              </g>
            );
          })}

          <path className="chart-ice" d={chart.pathIce} />
          <path className="chart-liquid" d={chart.pathLiquid} />
          <path className="chart-steam" d={chart.pathSteam} />

          <line className="chart-cur" x1={chart.curX} x2={chart.curX} y1={PAD_T} y2={CHART_H - PAD_B} />

          {chart.tsat >= chart.xMin && chart.tsat <= chart.xMax && (
            <line
              className="chart-tsat"
              x1={chart.sx(chart.tsat)}
              x2={chart.sx(chart.tsat)}
              y1={PAD_T}
              y2={CHART_H - PAD_B}
            />
          )}

          {chart.tmelt >= chart.xMin && chart.tmelt <= chart.xMax && (
            <line
              className="chart-tmelt"
              x1={chart.sx(chart.tmelt)}
              x2={chart.sx(chart.tmelt)}
              y1={PAD_T}
              y2={CHART_H - PAD_B}
            />
          )}

          <rect
            className="chart-overlay"
            x={PAD_L}
            y={PAD_T}
            width={CHART_W - PAD_L - PAD_R}
            height={CHART_H - PAD_T - PAD_B}
            fill="transparent"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * (CHART_W - PAD_L - PAD_R) + PAD_L;
              let nearest = 0;
              let best = Infinity;
              chart.points.forEach((p, idx) => {
                const d = Math.abs(p.x - x);
                if (d < best) {
                  best = d;
                  nearest = idx;
                }
              });
              setHoverIdx(nearest);
            }}
            onMouseLeave={() => setHoverIdx(-1)}
          />

          {hoverPoint && (
            <>
              <line
                className="chart-hover-line"
                x1={hoverPoint.x}
                x2={hoverPoint.x}
                y1={PAD_T}
                y2={CHART_H - PAD_B}
              />
              <circle
                className={`chart-hover-dot ${hoverPoint.phase === "water" ? "liquid" : hoverPoint.phase}`}
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="4"
              />
            </>
          )}

          <text className="chart-axis" x={(PAD_L + CHART_W - PAD_R) / 2} y={CHART_H - 10} textAnchor="middle">
            T, °C
          </text>
          <text
            className="chart-axis"
            x="16"
            y={(PAD_T + CHART_H - PAD_B) / 2}
            transform={`rotate(-90 16 ${(PAD_T + CHART_H - PAD_B) / 2})`}
            textAnchor="middle"
          >
            {t(activeMeta.labelKey)}, {t(activeMeta.unitKey)}
          </text>
        </svg>

        <div className={`chart-tooltip ${hoverPoint ? "visible" : ""}`} style={tooltipStyle}>
          {hoverPoint && (
            <>
              <div className="ct-row">
                <span className="ct-key">T</span>
                <span className="ct-val">{fmt(hoverPoint.temp, 2)}</span>
                <span className="ct-unit">°C</span>
              </div>
              <div className="ct-row">
                <span className="ct-key">Y</span>
                <span className="ct-val">{fmt(hoverPoint.value, 4)}</span>
                <span className="ct-unit">{t(activeMeta.unitKey)}</span>
              </div>
              <div className={`ct-phase ${hoverPoint.phase === "water" ? "liquid" : hoverPoint.phase}`}>
                {t(`phase.${hoverPoint.phase}`)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="chart-legend">
        <span>{t("results.tmeltLabel")}</span>
        <span>{t("chart.legendIce")}</span>
        <span>{t("chart.legendLiquid")}</span>
        <span>{t("chart.legendSteam")}</span>
        <span>{t("chart.legendCurrent")}</span>
      </div>
    </section>
  );
}
