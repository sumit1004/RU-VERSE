import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import './EventRegistrationsView.css';

/**
 * EventRegistrationsView Component
 * - Displays public-safe registration list for a specific event
 * - Preserves strict privacy: returns only teamName+leaderName or participantName
 * - Live server-side search, type filtering (Teams/Individuals/All), and pagination
 * - Complete Loading, Empty, Error + Retry states
 * - Fluid sci-fi aesthetic matching the RUVERSE event modal
 */
export default function EventRegistrationsView({ event, onBack }) {
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounce search input changes by 300ms
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Determine which type filters to show based on event's supported registration mode
  const supportsTeams = event?.registrationType === 'TEAM' || event?.registrationType === 'BOTH';
  const supportsIndividuals = event?.registrationType === 'INDIVIDUAL' || event?.registrationType === 'BOTH';
  const showTypeTabs = event?.registrationType === 'BOTH';

  // Fetch registrations from public API
  const fetchRegistrations = useCallback(async () => {
    if (!event?.slug) return;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      };

      const res = await registrationService.getPublicEventRegistrations(event.slug, params);
      setRegistrations(res?.registrations || []);
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.message || 'Unable to load registrations. Please try again.');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [event?.slug, currentPage, debouncedSearch, typeFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const regUrl = event?.registrationUrl || (event?.slug ? `/events/${event.slug}/register` : null);

  return (
    <div className="event-reg-view-root">
      {/* 1. View Navigation Bar */}
      <div className="event-reg-view-nav">
        <button
          type="button"
          onClick={onBack}
          className="event-reg-view-back-btn"
          aria-label="Back to Event Manifest"
        >
          <span className="back-arrow" aria-hidden="true">←</span>
          <span>BACK TO EVENT</span>
        </button>

        <div className="event-reg-view-title-wrap">
          <div className="event-reg-view-tag">
            <span className="reg-tag-dot" />
            <span>CONFIRMED PARTICIPANTS</span>
          </div>
          <h3 className="event-reg-view-title">{event?.title || 'Event Registrations'}</h3>
        </div>

        {regUrl && (
          <Link to={regUrl} className="event-reg-view-cta-btn">
            <span>REGISTER NOW</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {/* 2. Controls Bar: Search + Dynamic Type Filters */}
      <div className="event-reg-view-controls">
        <div className="event-reg-search-box">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            ref={searchInputRef}
            type="text"
            className="event-reg-search-input"
            placeholder={
              event?.registrationType === 'TEAM'
                ? 'Search by team or leader name...'
                : event?.registrationType === 'INDIVIDUAL'
                ? 'Search participant name...'
                : 'Search team, leader, or participant...'
            }
            value={searchQuery}
            onChange={handleSearchInputChange}
            aria-label="Search registrations"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="event-reg-search-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {showTypeTabs && (
          <div className="event-reg-type-tabs" role="tablist" aria-label="Registration type filter">
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'ALL'}
              className={`event-reg-type-tab ${typeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('ALL')}
            >
              ALL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'TEAM'}
              className={`event-reg-type-tab ${typeFilter === 'TEAM' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('TEAM')}
            >
              TEAMS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'INDIVIDUAL'}
              className={`event-reg-type-tab ${typeFilter === 'INDIVIDUAL' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('INDIVIDUAL')}
            >
              INDIVIDUALS
            </button>
          </div>
        )}
      </div>

      {/* 3. Registrations List / States Area */}
      <div className="event-reg-list-container">
        {loading ? (
          <div className="event-reg-state-box loading">
            <div className="event-reg-spinner" />
            <span className="event-reg-state-text">
              RETRIEVING REGISTERED SQUADRONS // RUVERSE 2026...
            </span>
          </div>
        ) : error ? (
          <div className="event-reg-state-box error">
            <div className="state-icon error">!</div>
            <h4 className="state-heading">Unable to Load Registrations</h4>
            <p className="state-subtext">{error}</p>
            <button
              type="button"
              onClick={fetchRegistrations}
              className="event-reg-retry-btn"
            >
              <span>RETRY</span>
            </button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="event-reg-state-box empty">
            <div className="state-icon empty">∅</div>
            <h4 className="state-heading">
              {debouncedSearch ? 'No Matching Registrations Found' : 'No Registrations Yet'}
            </h4>
            <p className="state-subtext">
              {debouncedSearch
                ? `No registrations match "${debouncedSearch}". Try a different name or keyword.`
                : 'Be the first pioneer to register and lead the arena manifest!'}
            </p>
            {debouncedSearch ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="event-reg-retry-btn"
              >
                <span>CLEAR SEARCH</span>
              </button>
            ) : regUrl ? (
              <Link to={regUrl} className="event-reg-retry-btn">
                <span>REGISTER NOW →</span>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="event-reg-grid">
            {registrations.map((reg, idx) => {
              const itemNumber = (pagination.page - 1) * pagination.limit + idx + 1;
              const formattedNumber = String(itemNumber).padStart(2, '0');

              if (reg.registrationType === 'TEAM') {
                return (
                  <div key={reg.id || idx} className="event-reg-card is-team">
                    <div className="card-corner c-top-l" aria-hidden="true" />
                    <div className="card-corner c-top-r" aria-hidden="true" />
                    <div className="event-reg-card-top">
                      <span className="event-reg-idx">#{formattedNumber}</span>
                      <span className="event-reg-badge team">TEAM SQUAD</span>
                    </div>
                    <div className="event-reg-card-main">
                      <div className="event-reg-team-name">{reg.teamName || 'Unnamed Team'}</div>
                      <div className="event-reg-leader-name">
                        <span className="leader-label">Leader:</span>
                        <span className="leader-val">{reg.leaderName || 'Participant'}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={reg.id || idx} className="event-reg-card is-individual">
                  <div className="card-corner c-top-l" aria-hidden="true" />
                  <div className="card-corner c-top-r" aria-hidden="true" />
                  <div className="event-reg-card-top">
                    <span className="event-reg-idx">#{formattedNumber}</span>
                    <span className="event-reg-badge individual">INDIVIDUAL</span>
                  </div>
                  <div className="event-reg-card-main">
                    <div className="event-reg-participant-name">
                      {reg.participantName || 'Participant'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Pagination Bar */}
      {!loading && !error && pagination.total > 0 && (
        <div className="event-reg-pagination-bar">
          <div className="pagination-info">
            <span>
              SHOWING {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} OF {pagination.total} ENTRIES
            </span>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination-actions">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="Previous page"
              >
                ← PREV
              </button>
              <span className="pagination-page-indicator">
                PAGE {pagination.page} OF {pagination.totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="Next page"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
