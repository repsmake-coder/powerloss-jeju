# 파워로스랩 제주 — MVP 대시보드 (피벗 v2)

공공데이터 기반 **제주 재생에너지 저가가격·수익위험 예측 AI** 서비스.
(구 "출력제어 위험 예측"에서 2026-07-11 피벗 — 예측 대상을 현 시장구조에 맞게 전환)

## 실행
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성 → Vercel 자동배포(main push)
```

## 구조
- `src/engine/riskScore.js` — 저가위험 엔진 v2 (주간모드: 기상+요일+계절 / 당일모드: 기상+실측수요)
- `src/engine/briefing.js` — AI 브리핑 (규칙 기반, LLM 연동 지점)
- `src/data/params.json` — 학습 계수·정본 수치 **(수정 금지: 코드 출력 정본)**
- `src/data/smp_monthly.json` — 월간 리포트 데이터 (2024-01~2026-06, 30개월, 저가일·노출강도)
- `src/data/smp_recent.json` — 오늘 상황판용 최근 14거래일 실측 SMP (~2026-07-11 스냅샷)
- `src/data/plants.json` — 제주도 신재생에너지 발전시설 현황 (태양광 1,653개소)
- `api/forecast.js` — 기상청 단기예보 프록시 (Vercel env: KMA_SERVICE_KEY)

## 정본 수치 (2026-07-11 확정)
- 저가일 정의: 낮 10~16시 제주 SMP 20원/kWh 미만 2시간 이상
- 저가일: 2024년 11일 → 2025년 41일 → 2026년 상반기 31일
- 주간모드 AUC 0.851(2025)/0.869(2026H1) · 당일모드 0.878/0.858 (시간순 검증)
- 시장 기준가 119.8원/kWh · 수익노출(100kW): 24년 39만→25년 129만→26H1 73만 원
- ⚠️ 구버전 수치(0.904/0.929/26,185원 등)는 폐기 — 사용 금지

## 운영 연동 로드맵
- Oracle 서버(141.147.30.10) KPX 크롤러 가동 중 → vercel.json 프록시(/api/events) 연동 예정
- SMP·수요 일일 자동수집 → smp_recent 자동 갱신
- Anthropic API → briefing.js 대체
