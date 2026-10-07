/**
 * ==============================================================================
 * RUVERSE 2026 — EVENT CONFIGURATION & UTILITIES
 * ==============================================================================
 * All official festival events are stored in and served live by the MySQL database.
 * This module provides canonical category helpers and date formatting utilities.
 * ==============================================================================
 */

/**
 * 1. Default EVENT_CATEGORIES
 * Baseline category list. Dynamic categories are fetched live from /api/categories.
 */
export const EVENT_CATEGORIES = [
  { id: 'all', label: 'ALL' },
];

/**
 * 2. Helper: Date Formatter
 * Formats date arrays into human-friendly sci-fi festival strings.
 * Examples:
 *   ["2026-10-21"] -> "21 OCT 2026"
 *   ["2026-10-21", "2026-10-22"] -> "21–22 OCT 2026"
 *   ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"] -> "21–24 OCT 2026"
 */
export function formatEventDates(dates) {
  if (!dates || !Array.isArray(dates) || dates.length === 0) return '';

  const monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  try {
    const parsed = dates.map((d) => {
      if (typeof d === 'string' && d.includes('-')) {
        const [year, month, day] = d.split('-').map(Number);
        return { day, month: month - 1, year };
      }
      const parts = String(d).split(' ');
      if (parts.length >= 3) {
        return {
          day: parseInt(parts[0], 10),
          month: monthNames.indexOf(parts[1].slice(0, 3).toUpperCase()),
          year: parseInt(parts[2], 10)
        };
      }
      return null;
    }).filter(Boolean);

    if (parsed.length === 0) return dates.join(', ');

    const days = parsed.map((p) => p.day).sort((a, b) => a - b);
    const minDay = days[0];
    const maxDay = days[days.length - 1];
    const m = parsed[0].month >= 0 ? monthNames[parsed[0].month] : 'OCT';
    const y = parsed[0].year || 2026;

    if (minDay === maxDay || parsed.length === 1) {
      return `${minDay} ${m} ${y}`;
    }
    return `${minDay}–${maxDay} ${m} ${y}`;
  } catch {
    return dates.join(' • ');
  }
}

/**
 * 3. EVENTS Array
 * Zero dummy/mock data. All live events are populated from the backend database.
 */
export const EVENTS = [];

export const eventsData = EVENTS;
