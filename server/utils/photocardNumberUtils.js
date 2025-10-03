//photocardNumberUtils.js

const formatPhotocardNumber = (number) => {
  if (!number && number !== 0) return "N/A";

  // Handle identified cards: "017ID" → "#017ID"
  if (typeof number === "string" && number.endsWith("ID")) {
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

  return `#{number}`;
};

const generateIdentifiedNumber = (originalNumber) => {
  if (!originalNumber && originalNumber !== 0) return null;

  if (typeof originalNumber === "number") {
    return `${originalNumber.toString().padStart(3, "0")}ID`;
  }

  // If it's already a string, ensure it has leading zeros
  if (typeof originalNumber === "string") {
    const numericPart = originalNumber.replace("ID", "");
    const paddedNumber = numericPart.padStart(3, "0");
    return `${paddedNumber}ID`;
  }

  return `${originalNumber}ID`;
};

const extractOriginalNumber = (number) => {
  if (!number && number !== 0) return null;

  if (typeof number === "string" && number.endsWith("ID")) {
    const baseNumber = number.replace("ID", "");
    const numericValue = parseInt(baseNumber);
    return isNaN(numericValue) ? baseNumber : numericValue;
  }

  return typeof number === "string" && !isNaN(number)
    ? parseInt(number)
    : number;
};

const generateTemporaryNumber = (originalNumber) => {
  return originalNumber
    ? `DELETED_${originalNumber}_${Date.now()}`
    : `DELETED_${Date.now()}`;
};

module.exports = {
  formatPhotocardNumber,
  generateIdentifiedNumber,
  extractOriginalNumber,
  generateTemporaryNumber,
};
