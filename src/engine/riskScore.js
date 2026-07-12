// 파워로스랩 제주 — 저가가격 위험 엔진 v2
// 타깃: 저가일(낮 10~16시 SMP 20원/kWh 미만 2시간 이상)
// 검증(시간순): 당일모드 2025 AUC 0.878 / 2026H1 0.858 · 주간모드(+월) 0.851 / 0.869
import params from "../data/params.json";

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export const GRADES3 = [
  { min: 67, key: "very-high", label: "경보", note: "저가가격 발생 유력 — 백테스트 40~50%" },
  { min: 34, key: "caution", label: "주의", note: "조건 일부 충족" },
  { min: 0, key: "low", label: "낮음", note: "저가가격 가능성 낮음" },
];
export function gradeOf(score) {
  return GRADES3.find((g) => score >= g.min) ?? GRADES3[GRADES3.length - 1];
}

function zscore(vals, mean, std, coef, intercept) {
  let z = intercept;
  for (let i = 0; i < vals.length; i++) z += coef[i] * ((vals[i] - mean[i]) / std[i]);
  return z;
}

// 주간모드: 기상예보 + 요일 (수요 프록시) — features [irr, rain, wind, weekend]
export function weekScore({ sky, rainProbPct, windMs = null, isWeekend, month }) {
  const irrBase = params.monthly_irr[String(month)] ?? 1.9;
  const irr = irrBase * (params.sky_factor[sky] ?? 1.0);
  const wind = windMs ?? params.sky_wind[sky] ?? 4.0;
  const p = Math.max(0, Math.min(rainProbPct, 100));
  const rain = p < 30 ? 0 : p < 60 ? 2 : p < 80 ? 8 : 20;
  const wm = params.week_mode;
  const msin = Math.sin((2 * Math.PI * month) / 12);
  const mcos = Math.cos((2 * Math.PI * month) / 12);
  const z = zscore([irr, rain, wind, isWeekend ? 1 : 0, msin, mcos], wm.mean, wm.std, wm.coef, wm.intercept);
  const score = Math.round(sigmoid(z) * 100);
  return { score, grade: gradeOf(score), inputs: { sky, rainProbPct, windMs: wind, isWeekend } };
}

// 당일모드: 기상 실측/예보 + 당일 실측 제주 낮 수요(MW) — features [irr, rain, wind, demand]
export function todayScore({ irr, rainMm, windMs, demandMW }) {
  const tm = params.today_mode;
  const z = zscore([irr, rainMm, windMs, demandMW], tm.mean, tm.std, tm.coef, tm.intercept);
  const score = Math.round(sigmoid(z) * 100);
  return { score, grade: gradeOf(score) };
}

export function skyToIrr(sky, month) {
  const irrBase = params.monthly_irr[String(month)] ?? 1.9;
  return irrBase * (params.sky_factor[sky] ?? 1.0);
}

// 발전소별 수익노출액(원) = 설비용량(kW) × 노출강도(원/kW)
// 노출강도 = 저가시간(SMP<20원)에 한해 Σ 시간대이용률 × (기준가 − SMP)
export function exposureWon(capacityKw, expPerKw) {
  return Math.round(capacityKw * expPerKw);
}

export const BASE_PRICE = params.base_price; // 119.8원/kWh (2024.1~2026.6 낮 평균)
export const CANON = params.canon;
