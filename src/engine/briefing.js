// AI 브리핑 v2 — 저가가격·수익위험 (규칙 기반, LLM 연동 지점)
export function weeklyBriefing(days) {
  const worst = [...days].sort((a, b) => b.score - a.score)[0];
  if (!worst) return "";
  const why = reasons(worst.inputs).join(", ");
  if (worst.score >= 67)
    return `이번 주 저가가격 위험이 가장 높은 날은 ${worst.dateLabel}(위험도 ${worst.score}점, 경보)입니다. ${why} 조건이 겹쳐 낮 시간대 초저가·제로 가격 가능성이 있습니다. 입찰·발전계획 수립 시 해당일 낮 10~16시 구간을 확인하세요.`;
  if (worst.score >= 34)
    return `이번 주 최고 위험일은 ${worst.dateLabel}(${worst.score}점, 주의)입니다. ${why} 조건이 일부 충족되어 있어 시장가격 모니터링을 권장합니다.`;
  return `이번 주는 전반적으로 저가가격 위험이 낮게 전망됩니다. 최고 위험일도 ${worst.dateLabel}(${worst.score}점) 수준입니다.`;
}

export function todayBriefing({ risk, demandMW, sky, latest }) {
  const demandTxt =
    demandMW <= 580 ? "제주 낮 전력수요가 낮게 형성되는 조건이며" :
    demandMW >= 660 ? "제주 낮 전력수요가 비교적 높은 조건이며" :
    "제주 낮 전력수요는 평년 수준이며";
  const skyTxt = sky === "맑음" ? "맑은 날씨로 재생에너지 발전 조건이 높습니다" :
    sky === "흐림" ? "흐린 날씨로 재생에너지 발전 조건이 낮습니다" : "구름이 있는 날씨입니다";
  const recentTxt = latest
    ? ` 최근 거래일(${latest.date}) 실측 기준 낮 최저 SMP는 ${latest.minSMP}원/kWh, 20원 미만 ${latest.lowH}시간이었습니다.`
    : "";
  const advice = risk.score >= 67
    ? " 이 조건이 유지되면 낮 시간 초저가 발생 가능성이 높아 입찰가·발전계획 재확인을 권장합니다."
    : risk.score >= 34 ? " 낮 시간대 가격 흐름을 모니터링하세요." : "";
  return `${demandTxt}, ${skyTxt}. 현재 조건 기준 저가가격 위험도는 ${risk.score}점(${risk.grade.label})입니다.${recentTxt}${advice}`;
}

export function monthlyBriefing({ monthLabel, mo, won, plant }) {
  if (mo.lowDays === 0 && mo.lowHours === 0)
    return `${monthLabel}에는 낮 시간 20원/kWh 미만 저가가격이 관측되지 않았습니다. ${plant.name}의 해당 월 저가가격 노출은 없습니다.`;
  return `${monthLabel} 한 달 동안 저가일 ${mo.lowDays}일, 20원 미만 ${mo.lowHours}시간(0원 이하 ${mo.zeroHours}시간)이 관측되었고 최저 SMP는 ${mo.minSMP}원/kWh였습니다. ${plant.name}(${plant.capacityKw}kW)이 해당 시간대에 시장가격으로 정산되었다고 가정할 경우 수익노출 추정치는 약 ${won.toLocaleString()}원입니다. 본 수치는 기상 기반 예상 발전량과 시장 기준가(${'\u200b'}119.8원/kWh) 대비 추정이며, 계약·정산 유형에 따라 실제 영향은 다를 수 있습니다.`;
}

function reasons(inputs) {
  const r = [];
  if (inputs.sky === "맑음") r.push("맑음(고발전)");
  if (inputs.rainProbPct < 30) r.push("강수 없음");
  if ((inputs.windMs ?? 0) >= 4.5) r.push("풍속 높음");
  if (inputs.isWeekend) r.push("주말(저수요)");
  if (r.length === 0) r.push(inputs.sky ?? "기상 조건");
  return r;
}
