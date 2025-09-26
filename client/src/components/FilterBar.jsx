// FilterBar.jsx
import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import "../styles/components/FilterBar.css";

const FilterBar = memo(function FilterBar(props) {
  const {
    categories = ["Injured", "Deceased", "Missing"],
    selectedFilters,
    setSelectedFilters,
    showFlaggedDuplicates,
    setShowFlaggedDuplicates,
    unidentifiedFilter,
    setUnidentifiedFilter,
  } = props;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleCategory = useCallback(
    (category) => {
      setSelectedFilters((prevFilters) =>
        prevFilters.includes(category)
          ? prevFilters.filter((c) => c !== category)
          : [...prevFilters, category]
      );
    },
    [setSelectedFilters]
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedFilters((prevFilters) =>
      prevFilters.length === categories.length ? [] : categories
    );
  }, [setSelectedFilters, categories]);

  const handleUnidentifiedFilterChange = (e) => {
    const value = e.target.value;
    setUnidentifiedFilter(value);
  };

  const handleToggleShowFlaggedDuplicates = useCallback(() => {
    setShowFlaggedDuplicates((prev) => !prev);
  }, [setShowFlaggedDuplicates]);

  const isSelectAll = useMemo(
    () =>
      selectedFilters.length === 0 ||
      selectedFilters.length === categories.length,
    [selectedFilters, categories]
  );

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, handleClickOutside]);

  // --- RENDER ---
  return (
    <div className="filter-bar">
      <div className="dropdown-wrapper" ref={dropdownRef}>
        <button
          className="dropdown-toggle"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          Filter Categories
        </button>

        {showDropdown && (
          <div className="dropdown">
            <label htmlFor="select-all-checkbox">
              <input
                type="checkbox"
                id="select-all-checkbox"
                checked={isSelectAll}
                onChange={toggleSelectAll}
              />
              Select All
            </label>
            {categories.map((category) => (
              <label
                key={category}
                htmlFor={`category-${category
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
              >
                <input
                  type="checkbox"
                  id={`category-${category.toLowerCase().replace(/\s/g, "-")}`}
                  checked={selectedFilters.includes(category)}
                  onChange={() => toggleCategory(category)}
                />
                {category}
              </label>
            ))}
            <hr className="dropdown-divider" />

            <div className="unidentified-filter-group">
              <label>Show:</label>
              <label htmlFor="unidentified-all">
                <input
                  type="radio"
                  id="unidentified-all"
                  name="unidentifiedFilter"
                  value="all"
                  checked={unidentifiedFilter === "all"}
                  onChange={handleUnidentifiedFilterChange}
                />
                All
              </label>
              <label htmlFor="unidentified-identified">
                <input
                  type="radio"
                  id="unidentified-identified"
                  name="unidentifiedFilter"
                  value="identified"
                  checked={unidentifiedFilter === "identified"}
                  onChange={handleUnidentifiedFilterChange}
                />
                Identified Only
              </label>
              <label htmlFor="unidentified-unidentified">
                <input
                  type="radio"
                  id="unidentified-unidentified"
                  name="unidentifiedFilter"
                  value="unidentified"
                  checked={unidentifiedFilter === "unidentified"}
                  onChange={handleUnidentifiedFilterChange}
                />
                Unidentified Only
              </label>
            </div>

            <label htmlFor="show-flagged-duplicates-checkbox">
              <input
                type="checkbox"
                id="show-flagged-duplicates-checkbox"
                checked={showFlaggedDuplicates}
                onChange={handleToggleShowFlaggedDuplicates}
              />
              Show Flagged/Duplicates
            </label>
          </div>
        )}
      </div>
    </div>
  );
});

export default FilterBar;
