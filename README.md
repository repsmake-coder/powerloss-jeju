# 파워로스랩 제주 — MVP 대시보드

공공데이터 기반 제주 출력제어 위험 예측·영향 분석 AI 리포트 서비스.

## 실행
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성 → Vercel 배포
```

## 구조
- `src/engine/riskScore.js` — 리스크 엔진 (전망 모드 AUC 0.904 / 당일 모드 0.929, 2024 봄 100일 학습)
- `src/engine/briefing.js` — AI 브리핑 (규칙 기반, LLM 연동 지점)
- `src/data/params.json` — 학습 계수·정본 수치 (수정 금지: 코드 출력 정본)
- `src/data/events.json` — 전력거래소 공식 출력제어 실적 33건 (게시판 크롤링·정형화)
- `src/data/plants.json` — 데모 발전소 (제주도 발전사업허가현황 CSV 확보 시 교체)

## 탭 = 서식6 서비스 3종 (1:1)
주간 위험 전망 / 당일 경보 / 월간 영향 리포트

## 운영 연동 지점 (로드맵)
- 기상청 단기예보 API → Weekly 시나리오 자동 채움
- 당일 실측 제주 수요 → Today 슬라이더 자동값
- Anthropic API → briefing.js 대체
