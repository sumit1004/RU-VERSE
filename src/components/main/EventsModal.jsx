import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { EVENTS, EVENT_CATEGORIES } from '../../data/eventsData';
import EventSearch from './EventSearch';
import EventFilters from './EventFilters';
import EventCard from './EventCard';
import './EventsModal.css';

/**
 * EventsModal Component:
 * - Pure data-driven event database manifest for RUVERSE 2026.
 * - Interactive technical search bar with live letter-by-letter filtering & top 5 suggestions.
 * - Category filtering working seamlessly alongside search.
 * - Deterministic filtering calculated from canonical EVENTS dataset on every change.
 */
export default function EventsModal({ isOpen, onClose }) {
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

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
    EVENT_CATEGORIES.forEach((cat) => {
      map[cat.id] = cat.label;
    });
    return map;
  }, []);

  // Pure deterministic calculation: Category filter + Search query filter from canonical EVENTS
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const queryTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    return EVENTS.filter((event) => {
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
        event.id,
        ...categories,
        ...(Array.isArray(event.dates) ? event.dates : [event.dates])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTerms.every((term) => searchableText.includes(term));
    });
  }, [selectedCategory, searchQuery]);

  // Reset category and search query on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('all');
      setSearchQuery('');
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

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

        {/* 2. Controls Row: Search Box + Category Filter Tabs */}
        <div className="events-modal-controls-bar">
          <EventSearch
            events={EVENTS}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSelectSuggestion={handleSelectSuggestion}
            isMobile={isMobile}
          />
          <EventFilters
            categories={EVENT_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            events={EVENTS}
          />
        </div>

        {/* 3. Card Grid Manifest (Internally Scrollable) */}
        <div className="events-modal-scroll-body" ref={scrollAreaRef}>
          {filteredEvents.length > 0 ? (
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
                  'No active arenas found under this category filter.'
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
            {searchQuery.trim()
              ? `${filteredEvents.length} EVENT${filteredEvents.length === 1 ? '' : 'S'} FOUND`
              : `DISPLAYING ${filteredEvents.length} OF ${EVENTS.length} ARENAS`}
          </span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalElement, document.body)
    : modalElement;
}
