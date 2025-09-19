// getErrorMessage.js

export const getErrorMessage = (
  error,
  defaultMessage = "An unexpected error occurred."
) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};
