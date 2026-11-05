export function checkScheduleConflict(existingSchedules, newStartHour, duration, turnaround = 0.75) {
  const totalBlockNeeded = duration + turnaround;
  const newEndHour = newStartHour + totalBlockNeeded;

  if (newEndHour > 168) {
    return { hasConflict: true, message: '航班跨越到下週日 24:00 之後！' };
  }

  for (let s of existingSchedules) {
    const existingEnd = s.startHour + s.duration + s.turnaround;
    if (!(newEndHour <= s.startHour || newStartHour >= existingEnd)) {
      return {
        hasConflict: true,
        message: `時段與既有航班 [${s.flightNo}] 交疊（包含 45 分鐘過站整備時間）！`
      };
    }
  }

  return { hasConflict: false };
}
