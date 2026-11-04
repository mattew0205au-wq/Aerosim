// src/engine/ors.js
// ORS (Online Reservation System) 客流評分與機票競爭力引擎

/**
 * 計算航線的 ORS 吸引力評分 (0 ~ 100 分)
 * @param {number} ticketPrice 玩家設定的票價
 * @param {number} standardPrice 該航線的市場標準基準票價
 * @param {number} seatPitchSeat 座椅排距 (吋, 如 31 吋或 38 吋)
 * @param {boolean} isDirectFlight 是否為直飛航班
 */
function calculateORSScore(ticketPrice, standardPrice, seatPitchSeat, isDirectFlight) {
  let score = 50; // 基礎分 50 分

  // 1. 票價因子：價格比標準價便宜就加分，太貴就扣分
  const priceRatio = ticketPrice / standardPrice;
  if (priceRatio <= 1.0) {
    score += (1.0 - priceRatio) * 60; // 便宜 10% 約加 6 分
  } else {
    score -= (priceRatio - 1.0) * 80; // 貴 10% 約扣 8 分
  }

  // 2. 舒適度因子：座椅間距越寬加越多分
  if (seatPitchSeat >= 34) score += 15;      // 豪華座位
  else if (seatPitchSeat >= 31) score += 5;  // 標準座位
  else score -= 10;                          // 擠壓型座位

  // 3. 直飛懲罰：中轉航班扣分
  if (!isDirectFlight) {
    score -= 25;
  }

  // 限制分數範圍在 0 到 100 之間
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { calculateORSScore };
