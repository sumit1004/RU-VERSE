import React from 'react';

/**
 * EventFilters Component:
 * - Pure data-driven category filter bar.
 * - Dynamically consumes EVENT_CATEGORIES array.
 * - Counts matching events per category.
 * - Zero hardcoded category buttons.
 */
export default function EventFilters({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  events = []
}) {
  return (
    <div className="events-modal-filters-wrapper">
      <div
        className="events-modal-filters"
        role="tablist"
        aria-label="Event category filters"
      >
        {categories.map((cat) => {
          const isAll = cat.id === 'all';
          const count = isAll
            ? events.length
            : events.filter((e) => {
                const cats = Array.isArray(e.categories)
                  ? e.categories
                  : e.category
                  ? [e.category]
                  : [];
                return cats.includes(cat.id);
              }).length;

          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`modal-filter-tab ${isSelected ? 'is-active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="filter-tab-label">{cat.label}</span>
              <span className="filter-tab-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
