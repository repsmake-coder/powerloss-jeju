import React, { useMemo, useState } from "react";
import { forecastScore, todayScore, skyToIrr } from "../engine/riskScore.js";
import { todayBriefing } from "../engine/briefing.js";

const SKIES = ["맑음", "구름많음", "흐림"];

export default function Today({ plant }) {
  const [sky, setSky] = useState("맑음");
  const [rainProbPct, setRain] = useState(10);
  const [windMs, setWind] = useState(4.5);
  const [demandMW, setDemand] = useState(560);

  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const before = useMemo(
    () => forecastScore({ sky, rainProbPct, windMs, isWeekend }),
    [sky, rainProbPct, windMs, isWeekend]
  );
  const after = useMemo(() => {
    const p = Math.max(0, Math.min(rainProbPct, 100));
    const rainMm = p < 30 ? 0 : p < 60 ? 2 : p < 80 ? 8 : 20;
    return todayScore({ irr: skyToIrr(sky), rainMm, windMs, demandMW });
  }, [sky, rainProbPct, windMs, demandMW]);

  return (
    <>
      <section className="card section">
        <h2>오늘의 출력제어 경보</h2>
        <p className="sub">
          당일 아침 실측 제주 전력수요를 반영해 경보 확정도를 보정합니다 · 제어의 88%가 오전
          9~11시대에 시작
        </p>

        <div className="compare" style={{ margin: "22px 0 8px" }}>
          <div>
            <div className="sub">사전 전망 (예보 기반)</div>
            <div className={`hero-score c-${before.grade.key}`}>{before.score}</div>
            <span className={`badge ${before.grade.key}`}>{before.grade.label}</span>
          </div>
          <div className="arrow" aria-hidden>
            →
          </div>
          <div>
            <div className="sub">당일 보정 (실측 수요 반영)</div>
            <div className={`hero-score c-${after.grade.key}`}>{after.score}</div>
            <span className={`badge ${after.grade.key}`}>{after.grade.label}</span>
          </div>
        </div>

        <div className="controls no-print" style={{ marginTop: 18 }}>
          <label>
            하늘상태
            <select value={sky} onChange={(e) => setSky(e.target.value)}>
              {SKIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            강수확률 <span className="num">{rainProbPct}%</span>
            <input type="range" min="0" max="100" step="10" value={rainProbPct} onChange={(e) => setRain(+e.target.value)} />
          </label>
          <label>
            풍속 <span className="num">{windMs.toFixed(1)} m/s</span>
            <input type="range" min="1" max="9" step="0.5" value={windMs} onChange={(e) => setWind(+e.target.value)} />
          </label>
          <label>
            오전 제주 낮 최저수요 <span className="num">{demandMW} MW</span>
            <input type="range" min="480" max="780" step="5" value={demandMW} onChange={(e) => setDemand(+e.target.value)} />
          </label>
        </div>
        <p className="note">
          데모 모드: 수요값을 조정해 보정 효과를 확인할 수 있습니다(제어일 낮 최저수요 평균
          547MW, 비제어일 645MW). 운영 시 당일 실측 수요가 자동 연동됩니다.
        </p>

        <div className="brief">
          <span className="tag">AI 브리핑</span>
          {todayBriefing({ before, after, demandMW, sky })}
        </div>
      </section>
    </>
  );
}
