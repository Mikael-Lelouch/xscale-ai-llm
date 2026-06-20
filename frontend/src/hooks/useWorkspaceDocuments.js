import { useCallback, useEffect, useRef, useState } from "react";
import Document from "@/models/document";

/**
 * Custom hook for lazy-loading workspace documents with infinite scroll
 *
 * @param {number} workspaceId - The workspace ID to load documents for
 * @param {number} pageSize - Documents per page (default: 50)
 * @returns {Object} Object containing documents, pagination state, and control functions
 *
 * @example
 * const {
 *   documents,
 *   loading,
 *   hasMore,
 *   total,
 *   currentPage,
 *   error,
 *   sortBy,
 *   setSortBy,
 *   filterType,
 *   setFilterType,
 *   loadMore,
 *   reset
 * } = useWorkspaceDocuments(workspaceId, 50);
 */
export const useWorkspaceDocuments = (workspaceId, pageSize = 50) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("recent");
  const [filterType, setFilterType] = useState(null);
  const [error, setError] = useState(null);
  const pageRef = useRef(1);

  // Fetch documents for a specific page
  const fetchPage = useCallback(
    async (page, isLoadMore = false) => {
      try {
        setError(null);
        setLoading(true);

        const result = await Document.getForWorkspacePaginated(
          workspaceId,
          page,
          pageSize,
          sortBy,
          filterType
        );

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        if (isLoadMore) {
          setDocuments((prev) => [...prev, ...result.documents]);
        } else {
          setDocuments(result.documents);
        }

        setTotal(result.total);
        setCurrentPage(result.page);
        setHasMore(result.page < result.pages);
        pageRef.current = result.page;
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load documents");
        setLoading(false);
      }
    },
    [workspaceId, pageSize, sortBy, filterType]
  );

  // Initial load
  useEffect(() => {
    setDocuments([]);
    setCurrentPage(1);
    pageRef.current = 1;
    fetchPage(1, false);
  }, [sortBy, filterType, workspaceId]);

  // Load more documents (next page)
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchPage(pageRef.current + 1, true);
  }, [hasMore, loading, fetchPage]);

  // Reset to initial state
  const reset = useCallback(() => {
    setDocuments([]);
    setCurrentPage(1);
    setSortBy("recent");
    setFilterType(null);
    setError(null);
    pageRef.current = 1;
    fetchPage(1, false);
  }, [fetchPage]);

  return {
    // State
    documents,
    loading,
    hasMore,
    total,
    currentPage,
    error,
    sortBy,
    filterType,

    // Setters
    setSortBy,
    setFilterType,

    // Actions
    loadMore,
    reset,
  };
};

export default useWorkspaceDocuments;
