// formDataUtils.js

// Common initial form data for photocard forms
export const getInitialPhotocardFormData = (existingData = {}) => {
  return {
    name: existingData.name || "",
    age: existingData.age || "",
    months: existingData.months || "",
    condition: existingData.condition || "",
    biography: existingData.biography || "",
    isUnidentified: existingData.isUnidentified || false,
    image: existingData.image || null,
    isConfirmedDuplicate: existingData.isConfirmedDuplicate || false,
    duplicateOf: existingData.duplicateOf || null,
    ...existingData,
  };
};

// Common handleChange function for photocard forms
export const handlePhotocardFormChange =
  (setFormData, options = {}) =>
  (e) => {
    const { name: fieldName, value } = e.target;

    setFormData((prev) => {
      let newValue = value;

      // Special handling for age field (show/hide months)
      if (fieldName === "age") {
        const numericValue = value.replace(/[^0-9]/g, "");
        newValue = numericValue;
        const ageValue = parseInt(numericValue) || 0;

        // Months field visibility
        if (options.setShowMonthsField) {
          options.setShowMonthsField(ageValue < 3);
        }

        if (ageValue >= 3) {
          return { ...prev, [fieldName]: newValue, months: "" };
        }
      }

      // All other fields
      return { ...prev, [fieldName]: newValue };
    });

    // Additional field-specific logic
    if (fieldName === "name" && options.onNameChange) {
      options.onNameChange();
    }
  };

// Validation helper
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
