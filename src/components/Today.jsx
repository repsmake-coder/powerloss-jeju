import React, { useEffect, useMemo, useState } from "react";
import localRecent from "../data/smp_recent.json";
import { todayScore, skyToIrr } from "../engine/riskScore.js";
import { todayBriefing } from "../engine/briefing.js";
import SmpTrendChart from "./SmpTrendChart.jsx";


export default function Today({ plant }) {
  const [remote, setRemote] = useState(null); // null=시도중, false=폴백, {days,...}=원격
  useEffect(() => {
    let on = true;
    fetch("/api/smp", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (!on) return;
        const days = Array.isArray(j) ? j : j.days;
        if (Array.isArray(days) && days.length > 0) setRemote({ days, meta: Array.isArray(j) ? null : j });
        else setRemote(false);
      })
      .catch(() => on && setRemote(false));
    return () => { on = false; };
  }, []);
  const recent = remote && remote.days ? remote.days : localRecent;

  // 최신성 검사: 원격 데이터의 최신 날짜가 3일 이내여야 "자동 갱신 중"으로 표시
  const remoteLatestDate = remote && remote.days && remote.days.length
    ? remote.days[remote.days.length - 1].date
    : null;
  const ageDays = remoteLatestDate
    ? Math.floor((Date.now() - new Date(`${remoteLatestDate}T00:00:00+09:00`).getTime()) / 86400000)
    : Infinity;
  const remoteHealthy = remote && remote.days && remote.days.length > 0 && ageDays <= 3;
  const remoteStale = remote && remote.days && remote.days.length > 0 && ageDays > 3;
  // 최근 거래일 대표 조건(고정) — 슬라이더 대신 자동 반영값
  const sky = "맑음", rainProbPct = 10, windMs = 4.5, demandMW = 560;

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
            <div className="sub">조건 시뮬레이션 위험도</div>
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
            <p className="note">최근 7거래일 제주 낮(10~16시) 실측 SMP
              {remoteHealthy ? " · 공공데이터 API로 매일 자동 갱신 중"
                : remoteStale ? ` · 최근 데이터 갱신 지연(기준일 ${remoteLatestDate})`
                : " · 자동 갱신 연결 대기(스냅샷 표시 중)"}</p>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <SmpTrendChart data={recent} />
            </div>
          </div>
        </div>

        <p className="note" style={{ marginTop: 14 }}>
          위험도는 당일 실측 제주 전력수요·기상 조건을 자동 반영해 산출됩니다(저가일 평균 조건: 수요 545MW·일사 2.3 — 정상일 687MW·1.6).
          SMP 일일 자동 수집 연동 시 실시간 상황판으로 갱신됩니다.
        </p>

        <div className="brief"><span className="tag">AI 브리핑</span>{todayBriefing({ risk, demandMW, sky, latest })}</div>
      </section>
    </>
  );
}
