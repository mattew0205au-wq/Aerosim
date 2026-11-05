// Weekly aircraft utilisation checks. Times are measured from Monday 00:00 UTC.
export function checkScheduleConflict(existingSchedules = [], newStartHour, duration, turnaround = 0.75) {
  const start = Number(newStartHour), flight = Number(duration), buffer = Number(turnaround);
  if (![start, flight, buffer].every(Number.isFinite) || start < 0 || flight <= 0 || buffer < 0) {
    return { hasConflict: true, message: "時間或航班資料不正確。" };
  }
  const end = start + flight + buffer;
  if (end > 168) return { hasConflict: true, message: "航班及過站時間超出本週 168 小時範圍。" };
  for (const item of existingSchedules) {
    const oldStart = Number(item.startHour), oldEnd = oldStart + Number(item.duration) + Number(item.turnaround || 0);
    if (Number.isFinite(oldStart) && Number.isFinite(oldEnd) && start < oldEnd && end > oldStart) {
      return { hasConflict: true, message: `時段與既有航班 ${item.flightNo || ""} 重疊（包括過站時間）。` };
    }
  }
  return { hasConflict: false, message: "" };
}
