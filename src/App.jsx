import React, { useMemo, useState } from "react";
import plants from "./data/plants.json";
import Weekly from "./components/Weekly.jsx";
import Today from "./components/Today.jsx";
import Monthly from "./components/Monthly.jsx";

const TABS = ["주간 위험 전망", "당일 경보", "월간 영향 리포트"];
const DEFAULT_ID = plants.find((p) => p.capacityKw >= 90 && p.capacityKw <= 110)?.id ?? plants[0].id;

export default function App() {
  const [tab, setTab] = useState(0);
  const [plantId, setPlantId] = useState(DEFAULT_ID);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const plant = plants.find((p) => p.id === plantId);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return plants
      .filter((p) => p.name.includes(q) || p.region.includes(q))
      .slice(0, 8);
  }, [query]);

  const pick = (p) => {
    setPlantId(p.id);
    setSearching(false);
    setQuery("");
  };

  return (
    <>
      <header className="hdr">
        <div className="hdr-in">
          <div className="brand">
            파워로스랩 제주
            <small>공공데이터 기반 제주 출력제어 위험 예측·영향 분석 AI 리포트</small>
          </div>
          <div className="spacer" />
        </div>
      </header>

      <main className="wrap">
        <section className="plant" aria-label="선택된 발전소">
          <div>
            <b>{plant.name}</b>
            <div className="meta">
              {plant.region} · {plant.source} · <span className="num">{plant.capacityKw}</span> kW
              {plant.startDate ? <> · 사업개시 <span className="num">{plant.startDate}</span></> : null}
            </div>
          </div>
          <div className="plant-pick no-print">
            {searching ? (
              <div className="search-box">
                <input
                  autoFocus
                  placeholder="발전소명 또는 지역 (2자 이상)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearching(false)}
                  aria-label="발전소 검색"
                />
                {results.length > 0 && (
                  <ul className="search-list" role="listbox">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => pick(p)}>
                          <b>{p.name}</b>
                          <span className="sub">
                            {p.region} · <span className="num">{p.capacityKw}</span>kW
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {query.trim().length >= 2 && results.length === 0 && (
                  <div className="search-empty">검색 결과가 없습니다. 다른 이름이나 읍면동으로 검색해 보세요.</div>
                )}
              </div>
            ) : (
              <button className="btn ghost" onClick={() => setSearching(true)}>
                발전소 검색
              </button>
            )}
          </div>
        </section>
        <p className="note" style={{ margin: "-6px 0 14px 4px" }}>
          발전소 데이터: 제주특별자치도 신재생에너지 발전시설 현황(공공데이터, 2024.12.31 기준) — 도내 태양광{" "}
          <span className="num">1,653</span>개소 검색 가능
        </p>

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
