import React, { useEffect, useMemo, useState } from "react";
import { weekScore } from "../engine/riskScore.js";
import { weeklyBriefing } from "../engine/briefing.js";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const DEFAULT_SCENARIO = [
  { sky: "맑음", rainProbPct: 10 }, { sky: "맑음", rainProbPct: 20 },
  { sky: "구름많음", rainProbPct: 30 }, { sky: "맑음", rainProbPct: 0 },
  { sky: "구름많음", rainProbPct: 40 }, { sky: "흐림", rainProbPct: 80 },
  { sky: "맑음", rainProbPct: 10 },
];

function buildDays(scenario) {
  const out = []; const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base); d.setDate(base.getDate() + 1 + i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const r = weekScore({ sky: scenario[i].sky, rainProbPct: scenario[i].rainProbPct,
      windMs: scenario[i].windMs ?? null, isWeekend, month: d.getMonth() + 1 });
    out.push({ ...r, idx: i, date: d,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`, highConf: i < 3 });
  }
  return out;
}

export default function Weekly({ plant }) {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [live, setLive] = useState(null);

  useEffect(() => {
    let on = true;
    fetch("/api/forecast")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (!on || !Array.isArray(j.days) || j.days.length === 0) return setLive(false);
        const today = new Date().toISOString().slice(0, 10);
        const future = j.days.filter((d) => d.date > today).slice(0, 7);
        if (future.length === 0) return setLive(false);
        setScenario((s) => s.map((row, i) => future[i]
          ? { sky: future[i].sky, rainProbPct: future[i].rainProbPct,
              ...(future[i].windMs != null ? { windMs: future[i].windMs } : {}) } : row));
        setLive({ n: Math.min(future.length, 7) });
      })
      .catch(() => on && setLive(false));
    return () => { on = false; };
  }, []);

  const days = useMemo(() => buildDays(scenario), [scenario]);
  const worst = [...days].sort((a, b) => b.score - a.score)[0];


  return (
    <>
      <section className="card section">
        <h2>이번 주 저가가격 위험 전망</h2>
        <p className="sub">
          낮 10~16시 SMP 20원/kWh 미만 2시간 이상 발생 위험 · 기상예보+요일 기반 · D+1~3 고신뢰, D+4~7 참고
        </p>
        <div className="strip" role="list">
          {days.map((d) => (
            <div key={d.idx} role="listitem"
              className={`day ${d.grade.key}`}
              aria-label={`${d.dateLabel} 위험도 ${d.score}점 ${d.grade.label}`}>
              <div className="d">{d.dateLabel}</div>
              <div className="s">{d.score}</div>
              <span className={`badge ${d.grade.key}`}>{d.grade.label}</span>
              <div className="conf">{d.highConf ? "고신뢰" : "참고 전망"}</div>
            </div>
          ))}
        </div>
        <p className="note">
          {live && live.n
            ? `기상청 단기예보 자동 반영 중 · D+1~${Math.min(live.n, 3)} 고신뢰 예측 (매일 자동 갱신)`
            : live === false
            ? "기상청 단기예보 자동 반영 · 매일 예보 갱신 시 위험도가 자동 재계산됩니다"
            : "기상청 단기예보를 불러오는 중…"}
        </p>
      </section>

      <section className="card section">
        <h2>가장 위험한 날</h2>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className={`hero-score c-${worst.grade.key}`}>{worst.score}<small> /100</small></div>
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
              시간순 검증 성능: 2025년 AUC <span className="num">0.851</span> ·
              2026년 상반기 AUC <span className="num">0.869</span> (저가일 포착률 88~94%)
            </p>
            <p className="note">경보 등급의 실제 저가일 발생률: 2026년 상반기 38% (낮음 등급 0%)</p>
          </div>
        </div>
        <div className="brief"><span className="tag">AI 브리핑</span>{weeklyBriefing(days)}</div>
      </section>
    </>
  );
}
