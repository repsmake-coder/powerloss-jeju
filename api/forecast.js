// Vercel Serverless — 기상청 단기예보 프록시 (제주시 nx=53, ny=38)
// 필요 env: KMA_SERVICE_KEY (공공데이터포털 '기상청_단기예보 조회서비스' 일반 인증키)
const SKY_MAP = { "1": "맑음", "3": "구름많음", "4": "흐림" };

export default async function handler(req, res) {
  const key = process.env.KMA_SERVICE_KEY;
  if (!key) return res.status(500).json({ error: "KMA_SERVICE_KEY 미설정" });

  const now = new Date(Date.now() + 9 * 3600 * 1000); // KST
  // 단기예보 발표시각: 02,05,08,11,14,17,20,23시 — 가장 최근 발표분 사용
  const slots = [23, 20, 17, 14, 11, 8, 5, 2];
  let baseDate = now, baseTime = null;
  for (const h of slots) {
    if (now.getUTCHours() > h || (now.getUTCHours() === h && now.getUTCMinutes() >= 15)) { baseTime = h; break; }
  }
  if (baseTime === null) { baseTime = 23; baseDate = new Date(now.getTime() - 24 * 3600 * 1000); }
  const bd = baseDate.toISOString().slice(0, 10).replace(/-/g, "");
  const bt = String(baseTime).padStart(2, "0") + "00";

  const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${encodeURIComponent(key)}&numOfRows=1000&pageNo=1&dataType=JSON&base_date=${bd}&base_time=${bt}&nx=53&ny=38`;

  try {
    const r = await fetch(url);
    const j = await r.json();
    const items = j?.response?.body?.items?.item;
    if (!Array.isArray(items)) return res.status(502).json({ error: "KMA 응답 형식 오류", detail: j?.response?.header });

    const byDate = {};
    for (const it of items) {
      const d = it.fcstDate;
      byDate[d] ??= { sky12: null, pops: [], winds: [] };
      if (it.category === "SKY" && it.fcstTime === "1200") byDate[d].sky12 = SKY_MAP[it.fcstValue] ?? "구름많음";
      if (it.category === "POP") byDate[d].pops.push(+it.fcstValue);
      if (it.category === "WSD" && ["1000","1200","1400"].includes(it.fcstTime)) byDate[d].winds.push(+it.fcstValue);
    }
    const days = Object.keys(byDate).sort().map((d) => {
      const v = byDate[d];
      return {
        date: `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`,
        sky: v.sky12 ?? "구름많음",
        rainProbPct: v.pops.length ? Math.max(...v.pops) : 30,
        windMs: v.winds.length ? +(v.winds.reduce((a,b)=>a+b,0)/v.winds.length).toFixed(1) : null,
      };
    }).filter((d) => d.sky !== null);

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json({ baseDate: bd, baseTime: bt, source: "기상청 단기예보(제주)", days });
  } catch (e) {
    return res.status(502).json({ error: "KMA 호출 실패", detail: String(e) });
  }
}
