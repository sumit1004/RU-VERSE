import { EVENTS, EVENT_CATEGORIES } from '../data/eventsData';

/**
 * Maps a backend API event model to the public event UI schema
 * preserving compatibility with all existing cards, modals, and search filters.
 */
export function mapApiEventToPublicEvent(apiEvent, index = 0) {
  if (!apiEvent) return null;

  const num = String(index + 1).padStart(2, '0');
  const catSlug = apiEvent.category?.slug || 'tech';
  
  // Format date range nicely
  let dates = ['FEB 2026'];
  if (apiEvent.startDate) {
    try {
      const s = new Date(apiEvent.startDate);
      const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (apiEvent.endDate) {
        const e = new Date(apiEvent.endDate);
        const eStr = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dates = [sStr, eStr];
      } else {
        dates = [s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })];
      }
    } catch {
      dates = ['FEB 2026'];
    }
  }

  // Registration URL based on registration mode
  let registrationUrl = null;
  if (apiEvent.registrationMode === 'EXTERNAL' && apiEvent.externalRegistrationUrl) {
    registrationUrl = apiEvent.externalRegistrationUrl;
  } else if (apiEvent.slug) {
    registrationUrl = `/events/${apiEvent.slug}/register`;
  }

  return {
    id: apiEvent.slug || String(apiEvent.id),
    number: num,
    title: apiEvent.title,
    tagline: apiEvent.tagline || (apiEvent.venue ? `📍 ${apiEvent.venue}` : ''),
    description: apiEvent.shortDescription || apiEvent.description || '',
    category: catSlug,
    categories: [catSlug],
    dates,
    image: apiEvent.bannerUrl || apiEvent.thumbnailUrl || null,
    registrationUrl,
    slug: apiEvent.slug,
    venue: apiEvent.venue,
    registrationType: apiEvent.registrationType,
    minTeamSize: apiEvent.minTeamSize,
    maxTeamSize: apiEvent.maxTeamSize,
    registrationFee: apiEvent.registrationFee,
    isFeatured: apiEvent.isFeatured,
  };
}

/**
 * Adapts an array of backend API events, with static fallback
 */
export function adaptApiEvents(apiEvents) {
  if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
    return EVENTS;
  }
  return apiEvents.map((evt, idx) => mapApiEventToPublicEvent(evt, idx));
}

/**
 * Adapts categories from backend API or falls back to static categories
 */
export function adaptApiCategories(apiCategories) {
  if (!Array.isArray(apiCategories) || apiCategories.length === 0) {
    return EVENT_CATEGORIES;
  }
  
  const allCat = { id: 'all', label: 'ALL ARENAS' };
  const mapped = apiCategories
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      id: c.slug,
      label: c.name.toUpperCase(),
    }));

  return [allCat, ...mapped];
}
