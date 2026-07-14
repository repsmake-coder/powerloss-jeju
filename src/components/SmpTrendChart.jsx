import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Dot,
} from "recharts";

const C = { navy: "#0B3552", teal: "#0E8B91", red: "#D9534F", orange: "#E7A727", grid: "#E2E8F0", gray: "#94A3B8" };

function pointColor(v) {
  if (v <= 0) return C.red;
  if (v < 20) return C.orange;
  return C.teal;
}

function ColorDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  return <Dot cx={cx} cy={cy} r={3.5} fill={pointColor(payload.min)} stroke="#fff" strokeWidth={1} />;
}

function TipBox({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
      <div style={{ color: C.navy, fontWeight: 700 }}>{p.date}</div>
      <div style={{ color: pointColor(p.min) }}>낮 최저 SMP {p.min.toLocaleString()}원/kWh</div>
    </div>
  );
}

// data: [{date:'YYYY-MM-DD', minSMP}] (오래된→최신 정렬 가정)
export default function SmpTrendChart({ data }) {
  const rows = (data || [])
    .filter((d) => d && d.date && d.minSMP != null && !Number.isNaN(Number(d.minSMP)))
    .map((d) => {
      const [, m, day] = d.date.split("-");
      return { date: d.date, label: `${+m}/${+day}`, min: Number(d.minSMP) };
    });

  if (rows.length === 0) {
    return <div style={{ padding: "28px 8px", color: C.gray, textAlign: "center", fontSize: 14 }}>표시할 가격 데이터가 없습니다.</div>;
  }

  const mn = Math.min(0, ...rows.map((r) => r.min));
  const mx = Math.max(...rows.map((r) => r.min));

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 2 }}>일별 낮 최저 SMP 추이</div>
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>단위: 원/kWh · 낮 10~16시 최저값</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.gray }} tickMargin={8} />
          <YAxis tick={{ fontSize: 11, fill: C.gray }} width={44} domain={[Math.floor(mn / 20) * 20, Math.ceil(mx / 20) * 20]} />
          <Tooltip content={<TipBox />} />
          <ReferenceLine y={20} stroke={C.orange} strokeDasharray="4 4" strokeWidth={1}
            label={{ value: "저가 기준 20원", position: "insideTopRight", fontSize: 10, fill: C.orange }} />
          <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeWidth={1}
            label={{ value: "0원", position: "insideBottomRight", fontSize: 10, fill: C.red }} />
          <Line type="monotone" dataKey="min" stroke={C.teal} strokeWidth={2}
            dot={<ColorDot />} activeDot={{ r: 5 }} isAnimationActive={true} animationDuration={500} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
