import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import { adaptApiEvents, adaptApiCategories } from '../../utils/eventAdapter';
import EventSearch from './EventSearch';
import EventFilters from './EventFilters';
import EventCard from './EventCard';
import './EventsModal.css';

/**
 * EventsModal Component:
 * - Real-time data-driven event database manifest for RUVERSE 2026.
 * - Interactive technical search bar with live letter-by-letter filtering & top 5 suggestions.
 * - Category filtering working seamlessly alongside search with live database categories.
 * - Zero dummy data; strictly connected to live published events.
 */
export default function EventsModal({ isOpen, onClose }) {
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const [eventsList, setEventsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([{ id: 'all', label: 'ALL' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Fetch live published events & categories from backend
  const fetchLiveEvents = async () => {
    try {
      setLoading(true);
      const [apiEvents, apiCats] = await Promise.all([
        eventService.getPublicEvents().catch(() => []),
        categoryService.getPublicCategories().catch(() => []),
      ]);

      const adaptedEvents = adaptApiEvents(apiEvents);
      const adaptedCategories = adaptApiCategories(apiCats);

      setEventsList(adaptedEvents);
      setCategoriesList(adaptedCategories);
    } catch {
      setEventsList([]);
      setCategoriesList([{ id: 'all', label: 'ALL' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  // Refresh live data whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchLiveEvents();
      setSelectedCategory('all');
      setSearchQuery('');
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // Track responsive viewport width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fast category ID -> Label lookup
  const categoryLabelMap = useMemo(() => {
    const map = {};
    categoriesList.forEach((cat) => {
      map[cat.id] = cat.label;
    });
    return map;
  }, [categoriesList]);

  // Pure deterministic calculation: Category filter + Search query filter from real dataset
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const queryTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    return eventsList.filter((event) => {
      // 1. Matches Category
      const categories = Array.isArray(event.categories)
        ? event.categories
        : event.category
        ? [event.category]
        : [];

      const matchesCategory =
        selectedCategory === 'all' || categories.includes(selectedCategory);

      if (!matchesCategory) return false;

      // 2. Matches Search Query (every term must be present)
      if (queryTerms.length === 0) return true;

      const searchableText = [
        event.title,
        event.tagline,
        event.description,
        event.venue,
        event.id,
        event.slug,
        ...categories,
        ...(Array.isArray(event.dates) ? event.dates : [event.dates])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTerms.every((term) => searchableText.includes(term));
    });
  }, [eventsList, selectedCategory, searchQuery]);

  // Manage body scroll lock and keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const handleSelectSuggestion = (title) => {
    setSearchQuery(title);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const modalElement = (
    <div className="events-modal-overlay" role="presentation">
      {/* Sibling Backdrop */}
      <div
        className="events-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel */}
      <div
        ref={modalRef}
        className="events-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Technical Brackets */}
        <div className="modal-corner top-l" aria-hidden="true" />
        <div className="modal-corner top-r" aria-hidden="true" />
        <div className="modal-corner btm-l" aria-hidden="true" />
        <div className="modal-corner btm-r" aria-hidden="true" />

        {/* 1. Modal Header (Pinned at Top) */}
        <div className="events-modal-header">
          <div className="modal-header-left">
            <div className="modal-tag">
              <span className="modal-tag-dot" />
              <span>EVENT DATABASE // 2026</span>
            </div>
            <h2 id="events-modal-title" className="events-modal-title">
              RUVERSE EVENTS
            </h2>
            <p className="events-modal-subtitle">
              Explore the official galaxy of technical, robotics, esports and departmental arenas.
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="events-modal-close"
            onClick={onClose}
            aria-label="Close events modal"
          >
            <span>CLOSE</span>
            <span className="close-x" aria-hidden="true">×</span>
          </button>
        </div>

        {/* 2. Controls Row: Search Box + Category Filter Tabs (Live Real-time Data) */}
        <div className="events-modal-controls-bar">
          <EventSearch
            events={eventsList}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSelectSuggestion={handleSelectSuggestion}
            isMobile={isMobile}
          />
          <EventFilters
            categories={categoriesList}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            events={eventsList}
          />
        </div>

        {/* 3. Card Grid Manifest (Internally Scrollable) */}
        <div className="events-modal-scroll-body" ref={scrollAreaRef}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 12px #6366f1', marginBottom: '1rem', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', fontFamily: 'monospace', color: '#94a3b8' }}>
                SYNCING REAL-TIME EVENT MANIFEST...
              </span>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-cards-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  categoryLabelMap={categoryLabelMap}
                />
              ))}
            </div>
          ) : (
            <div className="events-empty-state">
              <span className="empty-state-tag">// NO EVENT FOUND</span>
              <p className="empty-state-desc">
                {searchQuery.trim() ? (
                  <>
                    No arenas match &quot;{searchQuery}&quot;
                    {selectedCategory !== 'all'
                      ? ` in ${selectedCategory.toUpperCase()}`
                      : ''}.
                    <br />
                    <span className="empty-state-sub">
                      Try searching another keyword or switch category.
                    </span>
                  </>
                ) : (
                  'No live festival events currently available under this category.'
                )}
              </p>
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="events-modal-footer">
          <span className="modal-footer-brand">
            RUVERSE 2026 // RUNGTA INTERNATIONAL SKILLS UNIVERSITY
          </span>
          <span className="modal-footer-status">
            {loading
              ? 'SYNCING...'
              : searchQuery.trim()
              ? `${filteredEvents.length} EVENT${filteredEvents.length === 1 ? '' : 'S'} FOUND`
              : `DISPLAYING ${filteredEvents.length} OF ${eventsList.length} ARENAS`}
          </span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalElement, document.body)
    : modalElement;
}
