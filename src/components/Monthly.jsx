import React, { useMemo, useState } from "react";
import data from "../data/smp_monthly.json";
import { exposureWon, BASE_PRICE } from "../engine/riskScore.js";
import { monthlyBriefing } from "../engine/briefing.js";
import SmpBandDonut from "./SmpBandDonut.jsx";

const MONTHS = data.months.map((m) => m.month).sort().reverse();

export default function Monthly({ plant }) {
  const [month, setMonth] = useState(MONTHS[0]);
  const mo = useMemo(() => data.months.find((m) => m.month === month), [month]);
  const won = exposureWon(plant.capacityKw, mo.expPerKw);
  const monthLabel = `${month.slice(0, 4)}년 ${+month.slice(5)}월`;

  return (
    <section className="card section">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2>{monthLabel} 수익영향 리포트</h2>
        <span className="chip">전력거래소 제주 SMP 실측 기준</span>
        <div style={{ flex: 1 }} />
        <label className="no-print" style={{ fontSize: 13, color: "var(--sub)" }}>
          기준 월{" "}
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            style={{ font: "inherit", padding: "6px 9px", borderRadius: 8, border: "1px solid var(--line)" }}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <button className="btn no-print" onClick={() => window.print()}>PDF 리포트 생성</button>
      </div>
      <p className="sub" style={{ marginTop: 4 }}>
        {plant.name} · <span className="num">{plant.capacityKw}</span>kW ·
        시장 기준가 <span className="num">{BASE_PRICE}</span>원/kWh(2024.1~2026.6 낮 평균)
      </p>

      <div className="kpis">
        <div className="kpi"><div className="v">{mo.lowDays}일</div><div className="k">저가일(20원 미만 2h+)</div></div>
        <div className="kpi"><div className="v">{mo.lowHours}h</div><div className="k">20원 미만 시간</div></div>
        <div className="kpi"><div className="v">{mo.zeroHours}h</div><div className="k">0원 이하 시간</div></div>
        <div className="kpi"><div className="v num">{mo.minSMP}</div><div className="k">월 최저 SMP (원/kWh)</div></div>
        <div className="kpi"><div className="v">{won.toLocaleString()}원</div><div className="k">수익노출 추정치</div></div>
      </div>

      <div style={{ margin: "18px 0", paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <SmpBandDonut month={mo} />
      </div>

      {mo.days.length > 0 ? (
        <table>
          <thead><tr><th>일자</th><th className="num">20원 미만</th><th className="num">0원 이하</th><th className="num">일 최저 SMP</th><th className="num">내 발전소 노출액</th></tr></thead>
          <tbody>
            {mo.days.map((d) => (
              <tr key={d.date}>
                <td className="num">{d.date}</td>
                <td className="num">{d.lowH}h</td>
                <td className="num">{d.zeroH}h</td>
                <td className="num" style={d.minSMP <= 0 ? { color: "var(--g-vhigh)", fontWeight: 700 } : {}}>{d.minSMP}</td>
                <td className="num"><b>{exposureWon(plant.capacityKw, d.expPerKw).toLocaleString()}원</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="sub" style={{ padding: "14px 4px" }}>
          해당 월에는 저가일(20원 미만 2시간 이상)이 관측되지 않았습니다.
          {mo.lowHours > 0 && ` 단, 20원 미만 ${mo.lowHours}시간이 산발적으로 발생해 소액 노출이 집계되었습니다.`}
        </p>
      )}

      <p className="note">
        ※ 수익노출 추정치 = 저가시간(SMP&lt;20원)에 한해 시간대 이용률 × (기준가 − SMP) × 설비용량.
        기상 기반 예상 발전량 기준의 추정이며, 고정가격계약·SMP+REC·입찰시장 참여 등 계약·정산 유형에 따라
        실제 정산 영향과 다를 수 있습니다. 발전량 로그·정산자료 연동 시 리포트가 정밀화됩니다.
      </p>

      <div className="brief"><span className="tag">AI 브리핑</span>{monthlyBriefing({ monthLabel, mo, won, plant })}</div>
    </section>
  );
}
