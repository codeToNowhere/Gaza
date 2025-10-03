// Pagination.jsx
import { useCallback } from "react";
import "../styles/components/Pagination.css";

const Pagination = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;

  const handlePageClick = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [totalPages, onPageChange]
  );

  if (totalPages <= 1) return null;

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust when near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="pagniation" aria-label="Photocard pagination">
      <button
        className="pagination-btn"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={!hasPrevPage}
        aria-label="Previous page"
      >
        {" "}
        ‹ Previous
      </button>

      <div className="pagniation-numbers">
        {pageNumbers[0] > 1 && (
          <>
            <button
              className="pagination-number"
              onClick={() => handlePageClick(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="pagination-ellipsis">...</span>
            )}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`pagination-number ${
              page === currentPage ? "active" : ""
            }`}
            onClick={() => handlePageClick(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className="pagination-number"
              onClick={() => handlePageClick(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="pagination-btn"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
      >
        Next ›
      </button>
    </nav>
  );
};

export default Pagination;
