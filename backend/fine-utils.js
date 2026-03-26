function roundCurrency(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric * 100) / 100
}

function calculateCappedFine({ daysOverdue, dailyFineAmount, itemMonetaryValue }) {
  const safeDaysOverdue = Math.max(Number(daysOverdue) || 0, 0)
  const safeDailyFine = Math.max(Number(dailyFineAmount) || 0, 0)
  const rawFine = safeDaysOverdue * safeDailyFine

  const hasItemCap =
    Number.isFinite(Number(itemMonetaryValue)) && Number(itemMonetaryValue) > 0

  const cappedFine = hasItemCap
    ? Math.min(rawFine, Number(itemMonetaryValue))
    : rawFine

  return roundCurrency(cappedFine)
}

function isFineAtItemValueCap({ fineAmount, itemMonetaryValue }) {
  const fine = roundCurrency(fineAmount)
  const itemValue = roundCurrency(itemMonetaryValue)
  if (itemValue <= 0) return false
  return fine >= itemValue
}

module.exports = {
  roundCurrency,
  calculateCappedFine,
  isFineAtItemValueCap,
}
