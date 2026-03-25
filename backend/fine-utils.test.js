const test = require("node:test")
const assert = require("node:assert/strict")

const {
  calculateCappedFine,
  isFineAtItemValueCap,
  roundCurrency,
} = require("./fine-utils")

test("calculateCappedFine returns raw fine when below item value", () => {
  const fine = calculateCappedFine({
    daysOverdue: 4,
    dailyFineAmount: 1.25,
    itemMonetaryValue: 20,
  })

  assert.equal(fine, 5)
})

test("calculateCappedFine caps fine at item monetary value", () => {
  const fine = calculateCappedFine({
    daysOverdue: 30,
    dailyFineAmount: 2,
    itemMonetaryValue: 25.5,
  })

  assert.equal(fine, 25.5)
})

test("calculateCappedFine supports missing item value (no cap)", () => {
  const fine = calculateCappedFine({
    daysOverdue: 5,
    dailyFineAmount: 1,
    itemMonetaryValue: null,
  })

  assert.equal(fine, 5)
})

test("calculateCappedFine never returns negative values", () => {
  const fine = calculateCappedFine({
    daysOverdue: -10,
    dailyFineAmount: 1,
    itemMonetaryValue: 5,
  })

  assert.equal(fine, 0)
})

test("roundCurrency keeps two-decimal precision", () => {
  assert.equal(roundCurrency(10.126), 10.13)
  assert.equal(roundCurrency(10.124), 10.12)
})

test("isFineAtItemValueCap identifies cap state", () => {
  assert.equal(
    isFineAtItemValueCap({ fineAmount: 49.99, itemMonetaryValue: 49.99 }),
    true
  )

  assert.equal(
    isFineAtItemValueCap({ fineAmount: 48.99, itemMonetaryValue: 49.99 }),
    false
  )
})
