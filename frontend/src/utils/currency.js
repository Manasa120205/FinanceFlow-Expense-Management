/**
 * Currency and Financial Value Formatting Utilities
 * Standardized on Indian Rupee (INR - ₹) with modular structure for easy customization.
 */

const CURRENCY_CONFIG = {
  locale: 'en-IN',
  currency: 'INR',
  symbol: '₹'
};

/**
 * Format a numeric value as Indian Rupees (₹)
 * Examples:
 *   formatINR(1500) -> "₹1,500"
 *   formatINR(25000) -> "₹25,000"
 *   formatINR(125000) -> "₹1,25,000"
 *   formatINR(125000.5) -> "₹1,25,000.50"
 */
export function formatINR(amount, options = {}) {
  const {
    showDecimals = false,
    absolute = false,
    showSymbol = true
  } = options;

  let val = Number(amount);
  if (isNaN(val)) val = 0;
  if (absolute) val = Math.abs(val);

  const formatter = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2,
  });

  const formattedNum = formatter.format(val);
  return showSymbol ? `${CURRENCY_CONFIG.symbol}${formattedNum}` : formattedNum;
}

/**
 * Format percentage with one decimal place
 * Example: formatPercent(84.32) -> "84.3%"
 */
export function formatPercent(value) {
  const num = Number(value);
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(1)}%`;
}

/**
 * Format a date string (YYYY-MM-DD) into readable localized format
 * Example: formatDate("2026-09-15") -> "15 Sep 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
