// photocardUtils.js

// === Photocard Border and Status ===
export const getStatusLabel = (photocard) => {
  if (!photocard) {
    return "N/A";
  }

  if (photocard.condition === "missing") return "Missing";
  if (photocard.condition === "deceased") return "Deceased";

  return "Injured";
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
  Injured: {
    color: "#006400",
    border: "border-injured",
    label: "label-injured",
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
 * @param {Array} selectedFilters - An array of filter strings (e.g., ['Injured', 'Missing']).
 * @param {string} searchQuery - The search query string.
 * @param {boolean} showFlaggedDuplicates - Whether to include flagged/duplicate photocards.
 * @returns {Array} - The filtered array of photocards.
 */

export const applyFilters = (
  photocards,
  selectedFilters,
  showFlaggedDuplicates,
  unidentifiedFilter = "all",
  searchQuery = ""
) => {
  if (!Array.isArray(photocards)) {
    return [];
  }

  return photocards.filter((photocard) => {
    if (unidentifiedFilter === "identified" && photocard.isUnidentified) {
      return false;
    }
    if (unidentifiedFilter === "unidentified" && !photocard.isUnidentified) {
      return false;
    }

    const matchesFilter =
      selectedFilters.length === 0 ||
      selectedFilters.includes(getStatusLabel(photocard));

    const matchesSearch =
      searchQuery === "" ||
      photocard.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photocard.photocardNumber?.toString().includes(searchQuery) ||
      photocard.biography?.toLowerCase().includes(searchQuery.toLowerCase());

    const isFlaggedOrConfirmedDuplicate =
      photocard.flagged || photocard.isConfirmedDuplicate;

    if (!showFlaggedDuplicates && isFlaggedOrConfirmedDuplicate) {
      return false;
    }

    return matchesFilter && matchesSearch;
  });
};

// === FETCH IMAGE SOURCE ===
export const getPhotocardImageSrc = (photocard) => {
  if (!photocard || !photocard.image) {
    return "/camera-placeholder.png";
  }

  if (
    photocard.image.startsWith("data:image") ||
    photocard.image.startsWith("http")
  ) {
    return photocard.image;
  }

  return `${import.meta.env.VITE_BACKEND_URL}/uploads/${photocard.image}`;
};

// === Photocard Number Display ===
// In utils/photocardUtils.js
export const formatPhotocardNumber = (number) => {
  if (!number && number !== 0) return "N/A";

  if (typeof number === "string" && number.endsWith("ID")) {
    // Handle identified cards: "017ID" → "#017ID"
    const baseNumber = number.replace("ID", "");
    return `#${baseNumber}ID`;
  }

  // Handle regular numbers: 17 → "#017"
  if (typeof number === "number") {
    return `#${number.toString().padStart(3, "0")}`;
  }

  // Handle string numbers without ID: "17" → "#017"
  if (typeof number === "string" && !isNaN(number)) {
    return `#${number.padStart(3, "0")}`;
  }

  // Return as-is if it's already formatted or unknown format
  return `#${number}`;
};
