// AI 브리핑 — 엔진 출력 기반 템플릿 생성 (LLM 연동 전 규칙 기반)
export function weeklyBriefing(days) {
  const worst = [...days].sort((a, b) => b.score - a.score)[0];
  if (!worst) return "";
  const g = worst.grade.label;
  const why = reasons(worst.inputs).join(", ");
  if (worst.score >= 50)
    return `이번 주 출력제어 위험이 가장 높은 날은 ${worst.dateLabel}(위험도 ${worst.score}점, ${g})입니다. ${why} 조건이 겹쳐 있어 사전 대비가 필요합니다. 해당일 오전 9~11시 구간의 공식 출력제어 공지를 확인하는 것이 좋습니다.`;
  return `이번 주는 전반적으로 출력제어 위험이 낮게 전망됩니다. 가장 높은 날도 ${worst.dateLabel}(${worst.score}점, ${g}) 수준입니다.`;
}

export function todayBriefing({ before, after, demandMW, sky }) {
  const dir = after.score > before.score ? "상승" : after.score < before.score ? "하락" : "유지";
  const demandTxt =
    demandMW <= 580 ? "오늘 오전 제주 전력수요가 낮게 형성되고 있으며" :
    demandMW >= 660 ? "오늘 오전 제주 전력수요가 비교적 높게 형성되고 있으며" :
    "오늘 오전 제주 전력수요는 평년 수준이며";
  const skyTxt = sky === "맑음" ? "맑은 날씨로 재생에너지 발전 조건이 높아" :
    sky === "흐림" ? "흐린 날씨로 재생에너지 발전 조건이 낮아" : "구름이 있는 날씨로";
  let advice = after.score >= 50
    ? "발전사업자는 오전 9~11시 구간의 출력제어 공지와 설비 상태를 확인하는 것이 좋습니다."
    : "현재 시점의 출력제어 위험은 제한적입니다.";
  return `${demandTxt}, ${skyTxt} 당일 위험도가 사전 전망 대비 ${dir}했습니다(${before.score}점 → ${after.score}점). ${advice}`;
}

export function monthlyBriefing({ month, count, avgHours, maxHours, totalUpper, plant }) {
  return `${month} 한 달 동안 공식 출력제어가 ${count}일 시행되었습니다(평균 지속 ${avgHours}시간, 최대 ${maxHours}시간). ${plant.name}(${plant.capacityKw}kW)이 매회 제어 대상에 포함되었다고 가정할 경우 손실 상한은 약 ${totalUpper.toLocaleString()}원으로 추정됩니다. 본 수치는 공식 실적 기반 상한 추정이며, 발전량 로그·정산자료를 연동하면 리포트가 정밀화됩니다.`;
}

function reasons(inputs) {
  const r = [];
  if (inputs.sky === "맑음") r.push("맑음");
  if (inputs.rainProbPct < 30) r.push("강수 없음");
  if ((inputs.windMs ?? 0) >= 4) r.push("풍속 높음");
  if (inputs.isWeekend) r.push("주말(저수요)");
  if (r.length === 0) r.push(inputs.sky ?? "기상 조건");
  return r;
}
