import crypto from 'crypto';

/**
 * Generate a unique, readable registration number for RUVERSE 2026.
 * Format: RU26-XXXXXX (e.g. RU26-H8K3N9)
 * Character set excludes ambiguous characters (0, O, 1, I, L)
 */
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRegistrationNumber(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return `RU26-${code}`;
}
