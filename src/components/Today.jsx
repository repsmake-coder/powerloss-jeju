import React, { useMemo, useState } from "react";
import recent from "../data/smp_recent.json";
import { todayScore, skyToIrr } from "../engine/riskScore.js";
import { todayBriefing } from "../engine/briefing.js";

const SKIES = ["맑음", "구름많음", "흐림"];

export default function Today({ plant }) {
  const [sky, setSky] = useState("맑음");
  const [rainProbPct, setRain] = useState(10);
  const [windMs, setWind] = useState(4.5);
  const [demandMW, setDemand] = useState(560);

  const month = new Date().getMonth() + 1;
  const risk = useMemo(() => {
    const p = Math.max(0, Math.min(rainProbPct, 100));
    const rainMm = p < 30 ? 0 : p < 60 ? 2 : p < 80 ? 8 : 20;
    return todayScore({ irr: skyToIrr(sky, month), rainMm, windMs, demandMW });
  }, [sky, rainProbPct, windMs, demandMW, month]);

  const latest = recent[recent.length - 1];
  const shown = [...recent].slice(-7).reverse();

  return (
    <>
      <section className="card section">
        <h2>최근 가격·계통 상황</h2>
        <p className="sub">최근 거래일 실측 SMP + 현재 조건 기반 저가위험 갱신 · 데이터 기준일 {latest.date} · SMP 일일 자동수집 연동 시 당일 상황판으로 고도화</p>

        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap", margin: "18px 0 6px" }}>
          <div>
            <div className="sub">현재 조건 기준 저가위험도</div>
            <div className={`hero-score c-${risk.grade.key}`}>{risk.score}</div>
            <span className={`badge ${risk.grade.key}`}>{risk.grade.label}</span>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <table>
              <thead><tr><th>거래일</th><th className="num">낮 최저 SMP</th><th className="num">낮 평균</th><th className="num">20원 미만</th><th className="num">0원 이하</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.date}>
                    <td className="num">{r.date}</td>
                    <td className="num" style={r.minSMP < 20 ? { color: "var(--g-vhigh)", fontWeight: 700 } : {}}>{r.minSMP}</td>
                    <td className="num">{r.avgSMP}</td>
                    <td className="num">{r.lowH}h</td>
                    <td className="num">{r.zeroH}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">최근 7거래일 제주 낮(10~16시) 실측 SMP · 운영 시 매일 자동 갱신</p>
          </div>
        </div>

        <div className="controls no-print" style={{ marginTop: 14 }}>
          <label>하늘상태
            <select value={sky} onChange={(e) => setSky(e.target.value)}>{SKIES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label>강수확률 <span className="num">{rainProbPct}%</span>
            <input type="range" min="0" max="100" step="10" value={rainProbPct} onChange={(e) => setRain(+e.target.value)} />
          </label>
          <label>풍속 <span className="num">{windMs.toFixed(1)} m/s</span>
            <input type="range" min="1" max="9" step="0.5" value={windMs} onChange={(e) => setWind(+e.target.value)} />
          </label>
          <label>제주 낮 최저수요 <span className="num">{demandMW} MW</span>
            <input type="range" min="480" max="780" step="5" value={demandMW} onChange={(e) => setDemand(+e.target.value)} />
          </label>
        </div>
        <p className="note">
          데모 모드: 조건을 조정해 위험도 변화를 확인할 수 있습니다(저가일 평균 조건: 수요 545MW·일사 2.3 vs 정상일 687MW·1.6).
          운영 시 당일 실측 수요·기상이 자동 연동됩니다.
        </p>

        <div className="brief"><span className="tag">AI 브리핑</span>{todayBriefing({ risk, demandMW, sky, latest })}</div>
      </section>
    </>
  );
}
