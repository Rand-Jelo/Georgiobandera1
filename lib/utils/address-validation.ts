/**
 * Address validation utilities
 */

export interface AddressValidationResult {
  valid: boolean;
  errors: string[];
  suggestions?: string[];
}

/**
 * Validate postal code format based on country
 */
export function validatePostalCode(postalCode: string, country: string): AddressValidationResult {
  const errors: string[] = [];
  const trimmedCode = postalCode.trim().replace(/\s+/g, '');

  // Country-specific postal code patterns
  const patterns: Record<string, RegExp> = {
    SE: /^\d{5}$/, // Sweden: 5 digits
    NO: /^\d{4}$/, // Norway: 4 digits
    DK: /^\d{4}$/, // Denmark: 4 digits
    FI: /^\d{5}$/, // Finland: 5 digits
    DE: /^\d{5}$/, // Germany: 5 digits
    FR: /^\d{5}$/, // France: 5 digits
    GB: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK: Complex format
    US: /^\d{5}(-\d{4})?$/, // USA: 5 digits or 5+4
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // Canada: A1A 1A1
  };

  if (!trimmedCode) {
    errors.push('Postal code is required');
    return { valid: false, errors };
  }

  const pattern = patterns[country];
  if (pattern && !pattern.test(trimmedCode)) {
    errors.push(`Invalid postal code format for ${country}`);
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate address format
 */
export function validateAddressFormat(address: {
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}): AddressValidationResult {
  const errors: string[] = [];

  if (!address.line1 || address.line1.trim().length < 3) {
    errors.push('Address line 1 must be at least 3 characters');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City must be at least 2 characters');
  }

  const postalValidation = validatePostalCode(address.postalCode, address.country);
  if (!postalValidation.valid) {
    errors.push(...postalValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format postal code based on country
 */
export function formatPostalCode(postalCode: string, country: string): string {
  const trimmed = postalCode.trim().replace(/\s+/g, '');

  switch (country) {
    case 'SE':
    case 'NO':
    case 'DK':
    case 'FI':
    case 'DE':
    case 'FR':
      return trimmed; // Keep as is for numeric codes
    case 'GB':
      // Format UK postcode: SW1A1AA -> SW1A 1AA
      if (trimmed.length >= 5) {
        return `${trimmed.slice(0, -3)} ${trimmed.slice(-3)}`.toUpperCase();
      }
      return trimmed.toUpperCase();
    case 'CA':
      // Format Canadian postcode: A1A1A1 -> A1A 1A1
      if (trimmed.length === 6) {
        return `${trimmed.slice(0, 3)} ${trimmed.slice(3)}`.toUpperCase();
      }
      return trimmed.toUpperCase();
    default:
      return trimmed;
  }
}

