import React, { useMemo, useState } from "react";
import { forecastScore, lossUpper } from "../engine/riskScore.js";
import { weeklyBriefing } from "../engine/briefing.js";

const SKIES = ["맑음", "구름많음", "흐림"];
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

// 시연 기본 시나리오 (기상청 단기예보 연동 전 데모 입력값 — 편집 가능)
const DEFAULT_SCENARIO = [
  { sky: "맑음", rainProbPct: 10 },
  { sky: "맑음", rainProbPct: 20 },
  { sky: "구름많음", rainProbPct: 30 },
  { sky: "맑음", rainProbPct: 0 },
  { sky: "구름많음", rainProbPct: 40 },
  { sky: "흐림", rainProbPct: 80 },
  { sky: "맑음", rainProbPct: 10 },
];

function buildDays(scenario) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + 1 + i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const r = forecastScore({ ...scenario[i], isWeekend });
    out.push({
      ...r,
      idx: i,
      date: d,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`,
      highConf: i < 3,
    });
  }
  return out;
}

export default function Weekly({ plant }) {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [sel, setSel] = useState(0);
  const days = useMemo(() => buildDays(scenario), [scenario]);
  const worst = [...days].sort((a, b) => b.score - a.score)[0];
  const selDay = days[sel];
  const upper = lossUpper(plant.capacityKw);

  const update = (i, patch) =>
    setScenario((s) => s.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <>
      <section className="card section">
        <h2>이번 주 출력제어 위험 전망</h2>
        <p className="sub">
          기상청 단기예보 + 과거 출력제어 패턴 기반 · D+1~3 고신뢰 예측, D+4~7 참고 전망
        </p>

        <div className="strip" role="list">
          {days.map((d) => (
            <button
              key={d.idx}
              role="listitem"
              className={`day ${d.grade.key}${sel === d.idx ? " sel" : ""}`}
              onClick={() => setSel(d.idx)}
              aria-label={`${d.dateLabel} 위험도 ${d.score}점 ${d.grade.label}`}
            >
              <div className="d">{d.dateLabel}</div>
              <div className="s">{d.score}</div>
              <span className={`badge ${d.grade.key}`}>{d.grade.label}</span>
              <div className="conf">{d.highConf ? "고신뢰" : "참고 전망"}</div>
            </button>
          ))}
        </div>

        <div className="controls no-print" aria-label="선택일 시나리오 입력">
          <label>
            {selDay.dateLabel} 하늘상태
            <select
              value={scenario[sel].sky}
              onChange={(e) => update(sel, { sky: e.target.value })}
            >
              {SKIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            강수확률 <span className="num">{scenario[sel].rainProbPct}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={scenario[sel].rainProbPct}
              onChange={(e) => update(sel, { rainProbPct: +e.target.value })}
            />
          </label>
        </div>
        <p className="note">
          데모 모드: 예보값을 직접 조정해 위험도 변화를 확인할 수 있습니다. 운영 시 기상청
          단기예보 API가 자동 연동됩니다.
        </p>
      </section>

      <section className="card section">
        <h2>가장 위험한 날</h2>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className={`hero-score c-${worst.grade.key}`}>
              {worst.score}
              <small> /100</small>
            </div>
            <div style={{ marginTop: 6 }}>
              <b>{worst.dateLabel}</b> <span className={`badge ${worst.grade.key}`}>{worst.grade.label}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p className="sub">
              {worst.inputs.sky} · 강수확률 <span className="num">{worst.inputs.rainProbPct}%</span>
              {worst.inputs.isWeekend ? " · 주말(저수요)" : ""}
            </p>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              {plant.name}(<span className="num">{plant.capacityKw}</span>kW)이 제어 대상에 포함될
              경우 1회 손실 상한: <b className="num">{upper.toLocaleString()}원</b>
            </p>
            <p className="note">평균 지속 3.9시간 · 이용률 60% · SMP 111.9원/kWh 기준 상한 추정</p>
          </div>
        </div>
        <div className="brief">
          <span className="tag">AI 브리핑</span>
          {weeklyBriefing(days)}
        </div>
      </section>
    </>
  );
}
