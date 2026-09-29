/**
 * phoneFormatter.js
 * 
 * Standardized International Phone Number Formatter.
 * Ensures consistent international format (+XX ...) for ATS compliance and PDF text layers.
 * Adheres to RF-23, RQ-027, and Acceptance Criteria CA-02.
 */

/**
 * Normalizes a phone number into standardized international format with prefix (+XX).
 * 
 * @param {string} phone - Raw phone string (e.g. "11 1234-5678", "+54 9 11 1234-5678", "0054 11 12345678")
 * @param {string} defaultCountryCode - Country calling code without + (defaults to "54")
 * @returns {string} Standardized phone number with + prefix
 */
export const normalizePhoneNumber = (phone, defaultCountryCode = '54') => {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  // 1. If it already starts with +, preserve international prefix
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // 2. If it starts with '00', replace with '+'
  if (trimmed.startsWith('00')) {
    return normalizePhoneNumber('+' + trimmed.slice(2).trim(), defaultCountryCode);
  }

  // 3. Extract pure digits
  const rawDigits = trimmed.replace(/\D/g, '');
  if (!rawDigits) return trimmed;

  // 4. If digits already start with the default country code (e.g. 54 9 11 ...)
  if (rawDigits.startsWith(defaultCountryCode)) {
    return normalizePhoneNumber('+' + rawDigits, defaultCountryCode);
  }

  // 5. Local numbers (e.g. Argentina 11 1234-5678 or 10-digit mobile)
  if (defaultCountryCode === '54') {
    if (rawDigits.length === 10) {
      // e.g. 11 1234 5678 -> +54 9 11 1234-5678
      return `+54 9 ${rawDigits.slice(0, 2)} ${rawDigits.slice(2, 6)}-${rawDigits.slice(6)}`;
    }
    if (rawDigits.length === 11 && rawDigits.startsWith('9')) {
      // e.g. 9 11 1234 5678 -> +54 9 11 1234-5678
      return `+54 ${rawDigits.slice(0, 1)} ${rawDigits.slice(1, 3)} ${rawDigits.slice(3, 7)}-${rawDigits.slice(7)}`;
    }
    if (rawDigits.length === 8) {
      // 8-digit landline without area code -> +54 11 XXXX-XXXX
      return `+54 11 ${rawDigits.slice(0, 4)}-${rawDigits.slice(4)}`;
    }
  }

  // General fallback: prefix with + and default country code
  return `+${defaultCountryCode} ${trimmed}`;
};
