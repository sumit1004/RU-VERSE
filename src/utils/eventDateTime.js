/**
 * Event DateTime & Registration Status Utility
 * - Timezone: Asia/Kolkata (Indian Standard Time - IST)
 * - Rock-solid ISO date/time parsing and formatting
 * - Authoritative single-source registration status calculation
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Safely parse any date value into a valid Date object or null
 */
export function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format date in IST (e.g., "22 October 2026")
 */
export function formatISTDate(val, options = {}) {
  const d = safeDate(val);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: options.shortMonth ? 'short' : 'long',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format time in IST (e.g., "10:00 AM" or "04:30 PM")
 */
export function formatISTTime(val) {
  const d = safeDate(val);
  if (!d) return '';
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format full datetime in IST (e.g., "22 October 2026, 10:00 AM")
 */
export function formatISTDateTime(val) {
  const d = safeDate(val);
  if (!d) return '';
  return `${formatISTDate(d)}, ${formatISTTime(d)}`;
}

/**
 * Format date range (e.g., "22–24 October 2026" or "22 October 2026")
 */
export function formatDateRange(startVal, endVal) {
  const s = safeDate(startVal);
  const e = safeDate(endVal);

  if (!s && !e) return '';
  if (s && !e) return formatISTDate(s);
  if (!s && e) return formatISTDate(e);

  const sStr = s.toLocaleDateString('en-IN', { timeZone: IST_TIMEZONE, day: 'numeric', month: 'short' });
  const eStr = e.toLocaleDateString('en-IN', { timeZone: IST_TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' });

  if (s.toDateString() === e.toDateString()) {
    return formatISTDate(s);
  }
  return `${sStr} – ${eStr}`;
}

/**
 * Format time range (e.g., "10:00 AM – 04:00 PM")
 */
export function formatTimeRange(startVal, endVal) {
  const s = safeDate(startVal);
  const e = safeDate(endVal);

  if (!s && !e) return '';
  if (s && !e) return formatISTTime(s);
  if (!s && e) return formatISTTime(e);

  return `${formatISTTime(s)} – ${formatISTTime(e)}`;
}

/**
 * Single Authoritative Frontend Registration Status Evaluator
 * Accounts for:
 * 1. Unpublished / Draft / Archived / Inactive
 * 2. Manual status overrides
 * 3. Registration start / end time window
 * 4. Capacity limits
 */
export function getRegistrationStatus(event) {
  if (!event) {
    return {
      status: 'UNAVAILABLE',
      badgeClass: 'neutral',
      badgeText: 'UNAVAILABLE',
      headline: 'Registration Unavailable',
      message: 'Event details are currently not available.',
      buttonLabel: 'Unavailable',
      isOpen: false,
      canRegister: false,
    };
  }

  // 1. Publication / Archive state
  if (event.archivedAt) {
    return {
      status: 'ARCHIVED',
      badgeClass: 'danger',
      badgeText: 'ARCHIVED',
      headline: 'Event Archived',
      message: 'This event has been archived and is no longer accepting entries.',
      buttonLabel: 'Event Archived',
      isOpen: false,
      canRegister: false,
    };
  }

  if (event.isPublished === false || event.status === 'DRAFT') {
    return {
      status: 'DRAFT',
      badgeClass: 'warning',
      badgeText: 'DRAFT PREVIEW',
      headline: 'Event in Draft Mode',
      message: 'This event is currently in draft preparation.',
      buttonLabel: 'Draft Mode',
      isOpen: false,
      canRegister: false,
    };
  }

  if (event.isActive === false) {
    return {
      status: 'INACTIVE',
      badgeClass: 'danger',
      badgeText: 'INACTIVE',
      headline: 'Event Inactive',
      message: 'This event is currently deactivated by organizers.',
      buttonLabel: 'Event Inactive',
      isOpen: false,
      canRegister: false,
    };
  }

  // 2. Manual status override (if explicitly set)
  if (event.manualRegistrationStatus === 'CLOSED' || event.isRegistrationClosed === true) {
    return {
      status: 'MANUALLY_CLOSED',
      badgeClass: 'danger',
      badgeText: 'REGISTRATION CLOSED',
      headline: 'Registration Closed',
      message: 'Registration has been closed by the event organizer.',
      buttonLabel: 'Registration Closed',
      isOpen: false,
      canRegister: false,
    };
  }

  // 3. Time Window Validation
  const now = new Date();
  const regStart = safeDate(event.registrationStart);
  const regEnd = safeDate(event.registrationEnd);

  if (regStart && now < regStart) {
    const formattedStart = formatISTDateTime(regStart);
    return {
      status: 'UPCOMING',
      badgeClass: 'warning',
      badgeText: 'OPENS SOON',
      headline: 'Registration Opens Soon',
      message: `Registration opens on ${formattedStart} (IST).`,
      buttonLabel: `Opens on ${formatISTDate(regStart, { shortMonth: true })}`,
      isOpen: false,
      canRegister: false,
      opensAt: formattedStart,
    };
  }

  if (regEnd && now > regEnd) {
    const formattedEnd = formatISTDateTime(regEnd);
    return {
      status: 'CLOSED',
      badgeClass: 'danger',
      badgeText: 'REGISTRATION CLOSED',
      headline: 'Registration Closed',
      message: `Registration closed on ${formattedEnd} (IST).`,
      buttonLabel: 'Registration Closed',
      isOpen: false,
      canRegister: false,
      closedAt: formattedEnd,
    };
  }

  // 4. Capacity limit validation
  if (event.registrationLimit && typeof event.activeRegistrations === 'number' && event.activeRegistrations >= event.registrationLimit) {
    return {
      status: 'FULL',
      badgeClass: 'danger',
      badgeText: 'CAPACITY FULL',
      headline: 'Registration Full',
      message: 'Event registration capacity has been reached.',
      buttonLabel: 'Registration Full',
      isOpen: false,
      canRegister: false,
    };
  }

  // 5. Open and Active
  const formattedDeadline = regEnd ? formatISTDateTime(regEnd) : null;
  return {
    status: 'OPEN',
    badgeClass: 'success',
    badgeText: 'REGISTRATION OPEN',
    headline: 'Registration is Open',
    message: formattedDeadline ? `Registration closes on ${formattedDeadline} (IST).` : 'Registration is currently open for submissions.',
    buttonLabel: 'Register Now 🚀',
    isOpen: true,
    canRegister: true,
    deadline: formattedDeadline,
  };
}
