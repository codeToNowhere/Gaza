import { useState, useCallback, useEffect } from "react";
import { apiClient, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/getErrorMessage";

export const usePhotocardData = (filters = {}) => {
  const [photocards, setPhotocards] = useState([]);
  const [loadingPhotocards, setLoadingPhotocards] = useState(true);
  const [counts, setCounts] = useState({
    injured: 0,
    missing: 0,
    deceased: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [error, setError] = useState(null);
  const { loading: authLoading } = useAuth();

  const fetchPhotocards = useCallback(async (currentFilters = {}, page = 1) => {
    setLoadingPhotocards(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 100);

      if (currentFilters.excludeUnidentified) {
        params.append("excludeUnidentified", "true");
      }

      const response = await apiClient.get(`/photocards?${params.toString()}`);
      const {
        photocards: fetchedPhotocards,
        counts: fetchedCounts,
        pagination: fetchedPagination,
      } = response.data;

      if (
        !Array.isArray(fetchedPhotocards) ||
        typeof fetchedCounts !== "object"
      ) {
        throw new Error("Invalid response structure from server.");
      }

      setPhotocards(fetchedPhotocards);
      setCounts(fetchedCounts);
      setPagination(fetchedPagination);
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        "An unexpected error occurred while fetching data."
      );
      setError(errorMessage);
      setPhotocards([]);
      setCounts({
        injured: 0,
        missing: 0,
        deceased: 0,
        total: 0,
      });
    } finally {
      setLoadingPhotocards(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchPhotocards(filters, 1);
    }
  }, [authLoading, fetchPhotocards, filters]);

  const goToPage = useCallback(
    (page) => {
      fetchPhotocards(filters, page);
    },
    [fetchPhotocards, filters]
  );

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination, goToPage]);

  const refreshPhotocards = useCallback(() => {
    fetchPhotocards(filters);
  }, [fetchPhotocards, filters]);

  return {
    photocards,
    loadingPhotocards: loadingPhotocards || authLoading,
    counts,
    pagination,
    error,
    refreshPhotocards: () => fetchPhotocards(filters, pagination.currentPage),
    goToPage,
    nextPage,
    prevPage,
  };
};
