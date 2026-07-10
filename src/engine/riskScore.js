// 파워로스랩 제주 — 리스크 엔진 (risk_score.py JS 포팅)
// 정본: 2024 봄 시즌 100일 학습, 전망모드 LOO AUC 0.904 / 당일모드 0.929
import params from "../data/params.json";

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export const GRADES = [
  { min: 75, key: "very-high", label: "매우 높음", note: "백테스트 기준 해당 등급일 전일 제어 시행" },
  { min: 50, key: "high", label: "높음", note: "사전 대비 필요" },
  { min: 25, key: "caution", label: "주의", note: "제어 조건 일부 충족" },
  { min: 0, key: "low", label: "낮음", note: "출력제어 가능성 낮음" },
];

export function gradeOf(score) {
  return GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1];
}

// ---- 전망 모드: 기상예보(하늘상태·강수확률·풍속) + 요일 ----
export function forecastScore({ sky, rainProbPct, windMs = null, isWeekend }) {
  const fm = params.forecast_mode;
  const irr = fm.sky_irr[sky] ?? fm.sky_irr["구름많음"];
  const wind = windMs ?? fm.sky_wind[sky] ?? 3.8;
  const p = Math.max(0, Math.min(rainProbPct, 100));
  const rain = p < 30 ? 0 : p < 60 ? 2 : p < 80 ? 8 : 20;
  const z =
    fm.intercept +
    fm.coef.irr * irr +
    fm.coef.rain * rain +
    fm.coef.wind * wind +
    fm.coef.weekend * (isWeekend ? 1 : 0);
  const score = Math.round(sigmoid(z) * 100);
  return { score, grade: gradeOf(score), inputs: { sky, rainProbPct, windMs: wind, isWeekend } };
}

// ---- 당일 모드: 기상 + 당일 실측 제주 낮 최저수요(MW) ----
export function todayScore({ irr, rainMm, windMs, demandMW }) {
  const tm = params.today_mode;
  const x = [irr, rainMm, windMs, demandMW];
  let z = tm.intercept;
  for (let i = 0; i < x.length; i++) z += tm.coef[i] * ((x[i] - tm.mean[i]) / tm.std[i]);
  const score = Math.round(sigmoid(z) * 100);
  return { score, grade: gradeOf(score) };
}

// 하늘상태 → 일사 근사 (당일 모드에서 예보 입력을 쓸 때)
export function skyToIrr(sky) {
  return params.forecast_mode.sky_irr[sky] ?? params.forecast_mode.sky_irr["구름많음"];
}

// ---- 영향(손실 상한) 추정: 용량(kW) × 지속시간(h) × 이용률 × SMP ----
// ※ '제어 대상 포함 시 상한 추정' — 확정 손실이 아님
export function lossUpper(capacityKw, hours = params.loss.hours) {
  const { cf, smp } = params.loss;
  return Math.round(capacityKw * hours * cf * smp);
}

export const CANON = params.canon;
export const LOSS_BASIS = params.loss;
