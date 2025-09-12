// photocardUtils.js

// === Photocard Border and Status ===
export const getStatusLabel = (photocard) => {
  if (!photocard) {
    return "N/A";
  }

  if (photocard.condition === "missing") return "Missing";
  if (photocard.condition === "deceased") return "Deceased";

  return "Detained";
};

const STATUS_MAP = {
  Deceased: {
    color: "#000000",
    border: "border-deceased",
    label: "label-deceased",
  },
  Missing: {
    color: "#ff0000",
    border: "border-missing",
    label: "label-missing",
  },
  Detained: {
    color: "#006400",
    border: "border-detained",
    label: "label-detained",
  },
};

export const getBorderColor = (status) =>
  STATUS_MAP[status]?.color || "#006400";
export const getBorderClass = (status) =>
  STATUS_MAP[status]?.border || "border-green";
export const getLabelClass = (status) => STATUS_MAP[status]?.label || "";

// === Photocard Filters ===
/**
 * Applies filters and search queries to a list of photocards
 * @param {Array} photocards - The array of all photocards.
 * @param {Array} selectedFilters - An array of filter strings (e.g., ['Detained', 'Missing']).
 * @param {string} searchQuery - The search query string.
 * @param {boolean} showFlaggedDuplicates - Whether to include flagged/duplicate photocards.
 * @returns {Array} - The filtered array of photocards.
 */

export const applyFilters = (
  photocards,
  selectedFilters,
  searchQuery,
  showFlaggedDuplicates
) => {
  if (!Array.isArray(photocards)) {
    console.warn(
      "applyFilters: 'photocards' is not an array. Returning empty array."
    );
    return [];
  }

  return photocards.filter((photocards) => {
    const matchesFilter =
      selectedFilters.length === 0 ||
      selectedFilters.includes(getStatusLabel(photocard));

    const query = searchQuery.toLowerCase();
    const fullName = `${photocard.name}`.toLowerCase();

    const matchesSearch =
      searchQuery === "" ||
      fullName.includes(query) ||
      photocard.age ||
      photocard.condition;

    const isFlaggedOrConfirmedDuplicate =
      photocard.flagged || photocard.isConfirmedDuplicate;

    if (!showFlaggedDuplicates && isFlaggedOrConfirmedDuplicate) {
      return false;
    }

    return matchesFilter && matchesSearch;
  });
};
