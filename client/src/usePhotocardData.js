// usePhotocardData.js
import { useState, useCallback, useEffect } from "react";
import { apiClient, useAuth } from "./context/AuthContext";

export const usePhotocardData = () => {
  const [photocards, setPhotocards] = useState([]);
  const [loadingPhotocards, setLoadingPhotocards] = useState(true);
  const [counts, setCounts] = useState({
    detained: 0,
    missing: 0,
    deceased: 0,
    total: 0,
  });
  const [error, setError] = useState(null);
  const { loading: authLoading } = useAuth();

  const fetchPhotocards = useCallback(async () => {
    setLoadingPhotocards(true);
    setError(null);
    try {
      const response = await apiClient.get("/photocards");
      const { photocards: fetchedPhotocards, counts: fetchedCounts } =
        response.data;

      if (
        !Array.isArray(fetchedPhotocards) ||
        typeof fetchedCounts !== "object"
      ) {
        throw new Error("Invalid response structure from server.");
      }

      setPhotocards(fetchedPhotocards);
      setCounts(fetchedCounts);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while fetching data.";
      setError(errorMessage);
      setPhotocards([]);
      setCounts({ detained: 0, missing: 0, deceased: 0, total: 0 });
    } finally {
      setLoadingPhotocards(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      let frameId = requestAnimationFrame(() => {
        fetchPhotocards();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [authLoading, fetchPhotocards]);

  return {
    photocards,
    loadingPhotocards: loadingPhotocards || authLoading,
    counts,
    error,
    refreshPhotocards: fetchPhotocards,
  };
};
