// ORS: simplified passenger preference score for the AeroSim game.
export function calculateORSScore(ticketPrice, standardPrice, seatPitchSeat = 31, isDirectFlight = true) {
  const price = Math.max(1, Number(ticketPrice) || 1);
  const standard = Math.max(1, Number(standardPrice) || 1);
  let score = 50;
  const ratio = price / standard;
  score += ratio <= 1 ? (1 - ratio) * 60 : -(ratio - 1) * 80;
  if (seatPitchSeat >= 34) score += 15;
  else if (seatPitchSeat >= 31) score += 5;
  else score -= 10;
  if (!isDirectFlight) score -= 25;
  return Math.max(0, Math.min(100, Math.round(score)));
}
