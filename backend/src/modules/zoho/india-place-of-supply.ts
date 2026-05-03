/**
 * Zoho Inventory (India GST) expects `place_of_supply` as a two-letter state/UT code
 * (ISO 3166-2:IN style, e.g. TN, DL, MH). Checkout often stores full names — map them here.
 * @see https://www.zoho.com/inventory/api/v1/invoices/
 */

const ISO_IN_STATE_CODES = new Set<string>([
  'AN',
  'AP',
  'AR',
  'AS',
  'BR',
  'CG',
  'CH',
  'DD',
  'DL',
  'GA',
  'GJ',
  'HP',
  'HR',
  'JK',
  'JH',
  'KA',
  'KL',
  'LA',
  'LD',
  'MH',
  'MN',
  'ML',
  'MZ',
  'NL',
  'OD',
  'PB',
  'PY',
  'RJ',
  'SK',
  'TN',
  'TG',
  'TR',
  'UP',
  'UT',
  'WB',
  'MP',
]);

function norm(s: string): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prefer longer phrases first where names share substrings.
 */
const STATE_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['national capital territory of delhi', 'DL'],
  ['arunachal pradesh', 'AR'],
  ['andhra pradesh', 'AP'],
  ['himachal pradesh', 'HP'],
  ['madhya pradesh', 'MP'],
  ['uttar pradesh', 'UP'],
  ['tamil nadu', 'TN'],
  ['tamilnadu', 'TN'],
  ['west bengal', 'WB'],
  ['jammu and kashmir', 'JK'],
  ['jammu & kashmir', 'JK'],
  ['dadra nagar haveli', 'DD'],
  ['andaman and nicobar islands', 'AN'],
  ['andaman nicobar', 'AN'],
  ['assam', 'AS'],
  ['bihar', 'BR'],
  ['chhattisgarh', 'CG'],
  ['goa', 'GA'],
  ['gujarat', 'GJ'],
  ['haryana', 'HR'],
  ['jharkhand', 'JH'],
  ['karnataka', 'KA'],
  ['kerala', 'KL'],
  ['maharashtra', 'MH'],
  ['manipur', 'MN'],
  ['meghalaya', 'ML'],
  ['mizoram', 'MZ'],
  ['nagaland', 'NL'],
  ['odisha', 'OD'],
  ['orissa', 'OD'],
  ['punjab', 'PB'],
  ['rajasthan', 'RJ'],
  ['sikkim', 'SK'],
  ['telangana', 'TG'],
  ['tripura', 'TR'],
  ['uttaranchal', 'UT'],
  ['uttarakhand', 'UT'],
  ['chandigarh', 'CH'],
  ['dadra', 'DD'],
  ['daman', 'DD'],
  ['diu', 'DD'],
  ['new delhi', 'DL'],
  ['delhi', 'DL'],
  ['lakshadweep', 'LD'],
  ['ladakh', 'LA'],
  ['puducherry', 'PY'],
  ['pondicherry', 'PY'],
  ['jammu kashmir', 'JK'],
  ['andaman', 'AN'],
];

/** First digits of PIN → state code (last resort only). */
function placeCodeFromIndianPin(pincodeDigits: string): string | null {
  if (pincodeDigits.length < 6) {
    return null;
  }
  if (pincodeDigits.startsWith('110') || pincodeDigits.startsWith('111')) {
    return 'DL';
  }
  if (
    pincodeDigits.startsWith('121') ||
    pincodeDigits.startsWith('122') ||
    pincodeDigits.startsWith('123') ||
    pincodeDigits.startsWith('124') ||
    pincodeDigits.startsWith('125') ||
    pincodeDigits.startsWith('126') ||
    pincodeDigits.startsWith('127')
  ) {
    return 'HR';
  }
  return null;
}

/**
 * Upper-case state code suitable for Zoho `place_of_supply`, or null if unknown.
 */
export function resolveIndiaPlaceOfSupplyCode(
  stateRaw: string,
  pincodeRaw?: string | null,
): string | null {
  const s = String(stateRaw ?? '').trim();

  const pinDigits =
    pincodeRaw != null && String(pincodeRaw).trim()
      ? String(pincodeRaw).replace(/\D/g, '')
      : '';

  if (!s && pinDigits.length < 6) {
    return null;
  }

  const upper = s.toUpperCase().replace(/\s+/g, '');
  if (/^[A-Z]{2}$/.test(upper) && ISO_IN_STATE_CODES.has(upper)) {
    return upper;
  }

  const n = norm(s);
  if (/^[a-z]{2}$/.test(n)) {
    const up = n.toUpperCase();
    if (ISO_IN_STATE_CODES.has(up)) {
      return up;
    }
  }

  for (const [key, code] of STATE_ALIASES) {
    if (n === key || (key.length >= 6 && n.includes(key))) {
      return code;
    }
  }

  if (pinDigits.length >= 6) {
    return placeCodeFromIndianPin(pinDigits);
  }

  return null;
}
