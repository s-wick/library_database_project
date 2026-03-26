const test = require("node:test")
const assert = require("node:assert/strict")

const {
  DAILY_FINE_RATE,
  calculateCappedFine,
  calculateOutstandingFine,
  hasReachedItemValueCap,
} = require("../src/utils/fine-calculation")

test("calculateCappedFine uses $5/day by default", () => {
  assert.equal(DAILY_FINE_RATE, 5)
  assert.equal(calculateCappedFine(4, 50), 20)
})

test("calculateCappedFine is capped at item value", () => {
  assert.equal(calculateCappedFine(200, 19.99), 19.99)
})

test("calculateCappedFine floors days and never returns negative", () => {
  assert.equal(calculateCappedFine(14.9, 100), 70)
  assert.equal(calculateCappedFine(-2, 100), 0)
})

test("calculateOutstandingFine cannot go below zero", () => {
  assert.equal(calculateOutstandingFine(12.5, 2.5), 10)
  assert.equal(calculateOutstandingFine(5, 9), 0)
})

test("hasReachedItemValueCap returns true only at or above cap", () => {
  assert.equal(hasReachedItemValueCap(10, 10), true)
  assert.equal(hasReachedItemValueCap(12, 10), true)
  assert.equal(hasReachedItemValueCap(9.99, 10), false)
})