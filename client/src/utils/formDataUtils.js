// formDataUtils.js

// Simple and safe initial form data for photocard forms
export const getInitialPhotocardFormData = (existingData = {}) => {
  // Define safe defaults for all form fields
  const defaults = {
    name: "",
    age: "",
    months: "",
    condition: "",
    biography: "",
    isUnidentified: false,
    image: null,
    isConfirmedDuplicate: false,
    duplicateOf: null,
  };

  // Merge existingData with defaults, safely handling null/undefined
  const result = { ...defaults };

  // Only copy properties that exist in defaults and are not null/undefined
  Object.keys(defaults).forEach((key) => {
    if (existingData[key] != null) {
      result[key] = existingData[key];
    }
  });

  return result;
};

// Simplified handleChange function
export const handlePhotocardFormChange =
  (setFormData, options = {}) =>
  (e) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      let newValue = value;

      // Handle age field specifically
      if (name === "age") {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, "");
        newValue = numericValue;

        const ageValue = parseInt(numericValue) || 0;

        // Show/hide months field based on age
        if (options.setShowMonthsField) {
          options.setShowMonthsField(ageValue < 3);
        }

        // If age is 3 or older, clear months
        if (ageValue >= 3) {
          return {
            ...prev,
            age: newValue,
            months: "",
          };
        }
      }

      // For all other fields, just update the value
      return { ...prev, [name]: newValue };
    });

    // Optional: name change callback
    if (name === "name" && options.onNameChange) {
      options.onNameChange();
    }
  };

export const validatePhotocardForm = (formData) => {
  const errors = {};

  if (!formData.name.trim()) {
    errors.name = "Name is required";
  }

  if (formData.age && (formData.age < 0 || formData.age > 120)) {
    errors.age = "Age must be between 0 and 120";
  }

  return errors;
};
