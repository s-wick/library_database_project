const DAILY_FINE_RATE = 5

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculateCappedFine(
  daysOverdue,
  itemValue,
  dailyRate = DAILY_FINE_RATE
) {
  const overdueDays = Math.max(Math.floor(toNumber(daysOverdue)), 0)
  const maxValue = Math.max(toNumber(itemValue), 0)
  const rate = Math.max(toNumber(dailyRate), 0)
  const rawFine = overdueDays * rate
  return Math.min(rawFine, maxValue)
}

function calculateOutstandingFine(totalAmount, amountPaid) {
  return Math.max(toNumber(totalAmount) - toNumber(amountPaid), 0)
}

function hasReachedItemValueCap(totalAmount, itemValue) {
  return toNumber(itemValue) > 0 && toNumber(totalAmount) >= toNumber(itemValue)
}

module.exports = {
  DAILY_FINE_RATE,
  calculateCappedFine,
  calculateOutstandingFine,
  hasReachedItemValueCap,
}
