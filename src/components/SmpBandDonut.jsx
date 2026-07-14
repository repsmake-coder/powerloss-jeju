import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const C = { navy: "#0B3552", teal: "#0E8B91", red: "#D9534F", orange: "#E7A727", gray: "#94A3B8", slate: "#64748B" };

const BANDS = [
  { key: "neg", label: "0원 이하", color: C.red },
  { key: "low", label: "0~20원", color: C.orange },
  { key: "mid", label: "20~100원", color: C.teal },
  { key: "high", label: "100원 이상", color: C.slate },
];

// month.bands = {neg, low, mid, high, total} — 낮 10~16시 전체 시간의 실측 구간 분포
export default function SmpBandDonut({ month }) {
  const b = month && month.bands;
  const total = (b && b.total) || 0;
  const rows = BANDS.map((band) => ({ ...band, hours: b ? b[band.key] : 0 }));
  const pieData = rows.filter((r) => r.hours > 0);

  if (!b || total === 0) {
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 2 }}>SMP 구간별 시간 분포</div>
        <div style={{ padding: "28px 8px", color: C.gray, textAlign: "center", fontSize: 14 }}>표시할 가격 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 2 }}>SMP 구간별 시간 분포</div>
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>낮 10~16시 전체 시간 기준</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="hours" nameKey="label" cx="50%" cy="50%"
                innerRadius={54} outerRadius={80} paddingAngle={2} isAnimationActive animationDuration={500}>
                {pieData.map((r) => <Cell key={r.key} fill={r.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}h (${Math.round((v / total) * 100)}%)`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>총 {total}h</div>
            <div style={{ fontSize: 11, color: C.gray }}>분석시간</div>
          </div>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13, flex: 1, minWidth: 160 }}>
          {rows.map((r) => (
            <li key={r.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: r.color, display: "inline-block", opacity: r.hours ? 1 : 0.3 }} />
              <span style={{ color: r.hours ? C.navy : C.gray }}>
                {r.label} {r.hours}h ({Math.round((r.hours / total) * 100)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
