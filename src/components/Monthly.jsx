import React, { useMemo, useState } from "react";
import events from "../data/events.json";
import { lossUpper, LOSS_BASIS } from "../engine/riskScore.js";
import { monthlyBriefing } from "../engine/briefing.js";

const MONTHS = [...new Set(events.map((e) => e.date.slice(0, 7)))].sort();

export default function Monthly({ plant }) {
  const [month, setMonth] = useState("2024-05");
  const rows = useMemo(
    () =>
      events
        .filter((e) => e.date.startsWith(month))
        .map((e) => ({
          ...e,
          upper: lossUpper(plant.capacityKw, e.hours ?? LOSS_BASIS.hours),
        })),
    [month, plant]
  );

  const count = rows.length;
  const hoursArr = rows.map((r) => r.hours).filter((h) => h != null);
  const avgHours = hoursArr.length
    ? (hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length).toFixed(1)
    : "-";
  const maxHours = hoursArr.length ? Math.max(...hoursArr).toFixed(1) : "-";
  const totalUpper = rows.reduce((a, r) => a + r.upper, 0);
  const monthLabel = `${month.slice(0, 4)}년 ${+month.slice(5)}월`;

  return (
    <>
      <section className="card section">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2>{monthLabel} 출력제어 영향 리포트</h2>
          <span className="chip">공식 실적 기준 · 전력거래소 출력제어 공지</span>
          <div style={{ flex: 1 }} />
          <label className="no-print" style={{ fontSize: 13, color: "var(--sub)" }}>
            기준 월{" "}
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ font: "inherit", padding: "6px 9px", borderRadius: 8, border: "1px solid var(--line)" }}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button className="btn no-print" onClick={() => window.print()}>
            PDF 리포트 생성
          </button>
        </div>
        <p className="sub" style={{ marginTop: 4 }}>
          {plant.name} · <span className="num">{plant.capacityKw}</span>kW · SMP{" "}
          <span className="num">{LOSS_BASIS.smp}</span>원/kWh 기준
        </p>

        <div className="kpis">
          <div className="kpi">
            <div className="v">{count}일</div>
            <div className="k">출력제어 발생일</div>
          </div>
          <div className="kpi">
            <div className="v">{avgHours}h</div>
            <div className="k">평균 지속시간</div>
          </div>
          <div className="kpi">
            <div className="v">{maxHours}h</div>
            <div className="k">최대 지속시간</div>
          </div>
          <div className="kpi">
            <div className="v">{totalUpper.toLocaleString()}원</div>
            <div className="k">제어 대상 포함 시 손실 상한</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>일자</th>
              <th>시행 시간</th>
              <th className="num">지속</th>
              <th className="num">낮 최저수요</th>
              <th className="num">태양광 제어 규모</th>
              <th className="num">내 발전소 영향 상한</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date}>
                <td className="num">{r.date}</td>
                <td className="num">
                  {r.start && r.end ? `${r.start}~${r.end}` : "공지 참조"}
                </td>
                <td className="num">{r.hours != null ? `${r.hours}h` : "-"}</td>
                <td className="num">{r.minDemand != null ? `${r.minDemand}MW` : "-"}</td>
                <td className="num">{r.solarMW != null ? `${r.solarMW}MW` : "-"}</td>
                <td className="num">
                  <b>{r.upper.toLocaleString()}원</b>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="sub">
                  해당 월에는 공식 출력제어 실적이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="note">
          ※ 영향액은 '제어 대상 포함 시 상한 추정'이며 확정 손실이 아닙니다. 이용률 60% 가정,
          발전량 로그·정산자료 연동 시 리포트가 정밀화됩니다.
        </p>

        {count > 0 && (
          <div className="brief">
            <span className="tag">AI 브리핑</span>
            {monthlyBriefing({ month: monthLabel, count, avgHours, maxHours, totalUpper, plant })}
          </div>
        )}
      </section>
    </>
  );
}
