/**
 * Calculate tax amount from a tax-inclusive price
 * @param priceInclusive - Price that already includes tax
 * @param taxRate - Tax rate as a decimal (e.g., 0.25 for 25%)
 * @returns Tax amount
 */
export function calculateTaxFromInclusive(priceInclusive: number, taxRate: number): number {
  if (taxRate <= 0) return 0;
  // Tax = price * (tax_rate / (1 + tax_rate))
  return priceInclusive * (taxRate / (1 + taxRate));
}

/**
 * Calculate price without tax from a tax-inclusive price
 * @param priceInclusive - Price that already includes tax
 * @param taxRate - Tax rate as a decimal (e.g., 0.25 for 25%)
 * @returns Price without tax
 */
export function calculatePriceExcludingTax(priceInclusive: number, taxRate: number): number {
  if (taxRate <= 0) return priceInclusive;
  // Price without tax = price / (1 + tax_rate)
  return priceInclusive / (1 + taxRate);
}

/**
 * Get default tax rate (25% for Sweden)
 */
export function getDefaultTaxRate(): number {
  return 0.25; // 25% VAT
}

