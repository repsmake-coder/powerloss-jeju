import React, { useState } from "react";
import plants from "./data/plants.json";
import Weekly from "./components/Weekly.jsx";
import Today from "./components/Today.jsx";
import Monthly from "./components/Monthly.jsx";

const TABS = ["주간 위험 전망", "당일 경보", "월간 영향 리포트"];

export default function App() {
  const [tab, setTab] = useState(0);
  const [plantId, setPlantId] = useState(plants[0].id);
  const plant = plants.find((p) => p.id === plantId);

  return (
    <>
      <header className="hdr">
        <div className="hdr-in">
          <div className="brand">
            파워로스랩 제주
            <small>공공데이터 기반 제주 출력제어 위험 예측·영향 분석 AI 리포트</small>
          </div>
          <div className="spacer" />
          <span className="chip">데모 모드 · 2024 봄 시즌 공식 실적 학습</span>
        </div>
      </header>

      <main className="wrap">
        <section className="plant" aria-label="선택된 발전소">
          <div>
            <b>{plant.name}</b>
            <div className="meta">
              {plant.region} · {plant.source} · <span className="num">{plant.capacityKw}</span> kW
            </div>
          </div>
          <select value={plantId} onChange={(e) => setPlantId(e.target.value)} aria-label="발전소 선택">
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.capacityKw}kW)
              </option>
            ))}
          </select>
        </section>

        <nav className="tabs" role="tablist">
          {TABS.map((t, i) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === i}
              className={"tab" + (tab === i ? " on" : "")}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === 0 && <Weekly plant={plant} />}
        {tab === 1 && <Today plant={plant} />}
        {tab === 2 && <Monthly plant={plant} />}
      </main>
    </>
  );
}
