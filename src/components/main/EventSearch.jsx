import React, { useState, useRef, useEffect, useMemo } from 'react';
import './EventSearch.css';

/**
 * EventSearch Component:
 * - Desktop: Always-visible technical search box with suggestions dropdown.
 * - Mobile: Expandable search icon button that expands smoothly into an input.
 * - Real-time filtering and suggestion ranking from EVENTS.
 * - Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
 */
export default function EventSearch({
  events = [],
  searchQuery = '',
  onSearchChange,
  onSelectSuggestion,
  isMobile = false
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Compute top 5 suggestions based on relevance ranking
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const startsWithTitle = [];
    const containsInTitle = [];
    const containsInOther = [];
    const seenIds = new Set();

    events.forEach((event) => {
      if (!event || seenIds.has(event.id)) return;
      const title = (event.title || '').toLowerCase();
      const tagline = (event.tagline || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      const cats = (
        Array.isArray(event.categories)
          ? event.categories.join(' ')
          : event.category || ''
      ).toLowerCase();
      const id = (event.id || '').toLowerCase();

      if (title.startsWith(q)) {
        startsWithTitle.push(event);
        seenIds.add(event.id);
      } else if (title.includes(q) || tagline.includes(q)) {
        containsInTitle.push(event);
        seenIds.add(event.id);
      } else if (desc.includes(q) || cats.includes(q) || id.includes(q)) {
        containsInOther.push(event);
        seenIds.add(event.id);
      }
    });

    return [...startsWithTitle, ...containsInTitle, ...containsInOther].slice(0, 5);
  }, [events, searchQuery]);

  // Reset highlighted suggestion when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Handle outside clicks to close suggestion dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleInputChange = (e) => {
    onSearchChange(e.target.value);
    setIsFocused(true);
  };

  const handleClear = () => {
    onSearchChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (event) => {
    onSelectSuggestion(event.title);
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length || !isFocused) {
      if (e.key === 'Escape' && isMobileOpen) {
        e.stopPropagation();
        setIsMobileOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else {
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsFocused(false);
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        onSearchChange('');
      }
      return next;
    });
  };

  const showSuggestions = isFocused && suggestions.length > 0 && searchQuery.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`event-search-container ${isMobile ? 'is-mobile-view' : ''} ${
        isMobileOpen ? 'is-mobile-expanded' : ''
      }`}
    >
      {/* Mobile Search Toggle Icon Button */}
      {isMobile && !isMobileOpen ? (
        <button
          type="button"
          className="event-search-mobile-toggle"
          onClick={toggleMobileSearch}
          aria-label="Search events"
          title="Search events"
        >
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      ) : (
        /* Expanded Search Box (Always on Desktop, Expanded on Mobile) */
        <div className="event-search-box">
          {/* Tech Corner Brackets */}
          <div className="search-corner s-top-l" aria-hidden="true" />
          <div className="search-corner s-top-r" aria-hidden="true" />
          <div className="search-corner s-btm-l" aria-hidden="true" />
          <div className="search-corner s-btm-r" aria-hidden="true" />

          {/* Search Icon */}
          <svg
            className="search-input-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* Main Search Input */}
          <input
            ref={inputRef}
            type="search"
            className="event-search-input"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="SEARCH EVENTS..."
            aria-label="Search events"
            aria-autocomplete="list"
            aria-controls="event-search-suggestions"
            aria-expanded={showSuggestions}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear Button (when text exists) */}
          {searchQuery && (
            <button
              type="button"
              className="event-search-clear"
              onClick={handleClear}
              aria-label="Clear event search"
              title="Clear search"
            >
              ×
            </button>
          )}

          {/* Mobile Collapse Button */}
          {isMobile && isMobileOpen && (
            <button
              type="button"
              className="event-search-collapse"
              onClick={toggleMobileSearch}
              aria-label="Close search field"
              title="Close search"
            >
              CANCEL
            </button>
          )}
        </div>
      )}

      {/* Suggestion Dropdown Panel */}
      {showSuggestions && (
        <ul
          id="event-search-suggestions"
          className="event-search-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isHighlighted}
                className={`search-suggestion-item ${isHighlighted ? 'is-highlighted' : ''}`}
                onMouseDown={() => handleSuggestionClick(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span className="suggestion-num">// {item.number}</span>
                <span className="suggestion-title">{item.title}</span>
                {item.tagline && (
                  <span className="suggestion-tagline">{item.tagline}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
