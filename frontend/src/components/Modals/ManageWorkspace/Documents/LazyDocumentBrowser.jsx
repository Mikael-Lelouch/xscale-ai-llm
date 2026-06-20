import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Document from "@/models/document";
import PreLoader from "@/components/Preloader";

export default function LazyDocumentBrowser({
  workspaceId,
  onSelectDocuments,
  isEmbedded = false,
}) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedDocs, setSelectedDocs] = useState({});
  const [sortBy, setSortBy] = useState("recent");
  const [filterType, setFilterType] = useState(null);
  const [error, setError] = useState(null);

  const observerTarget = useRef(null);
  const pageSize = 50;

  // Fetch documents for current page
  const fetchDocuments = useCallback(
    async (pageNum = 1, isLoadMore = false) => {
      try {
        setError(null);
        setLoading(true);

        const result = await Document.getForWorkspacePaginated(
          workspaceId,
          pageNum,
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
        setPage(result.page);
        setHasMore(result.page < result.pages);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load documents");
        setLoading(false);
      }
    },
    [workspaceId, sortBy, filterType, pageSize]
  );

  // Initial fetch
  useEffect(() => {
    setDocuments([]);
    setPage(1);
    fetchDocuments(1, false);
  }, [sortBy, filterType]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          documents.length > 0
        ) {
          fetchDocuments(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, page, documents.length, fetchDocuments]);

  const handleSelectDocument = (docId) => {
    setSelectedDocs((prev) => {
      const newSelected = { ...prev };
      if (newSelected[docId]) {
        delete newSelected[docId];
      } else {
        newSelected[docId] = true;
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allDocIds = documents.map((doc) => doc.docId);
    const allSelected = allDocIds.every((id) => selectedDocs[id]);

    if (allSelected) {
      setSelectedDocs({});
    } else {
      const newSelected = {};
      allDocIds.forEach((id) => {
        newSelected[id] = true;
      });
      setSelectedDocs(newSelected);
    }
  };

  const handleAddSelected = () => {
    const selectedDocuments = documents.filter((doc) =>
      selectedDocs[doc.docId]
    );
    onSelectDocuments(selectedDocuments);
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button
          onClick={() => fetchDocuments(1, false)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedCount = Object.keys(selectedDocs).length;

  return (
    <div className="lazy-document-browser">
      {/* Header with controls */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("documents.available")} ({total})
            </h3>
            {selectedCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCount} selected
              </p>
            )}
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleAddSelected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Add Selected ({selectedCount})
            </button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded"
          >
            <option value="recent">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">Largest First</option>
          </select>

          <select
            value={filterType || ""}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word (DOCX)</option>
            <option value="txt">Text (TXT)</option>
            <option value="md">Markdown (MD)</option>
          </select>

          {(selectedCount > 0 || documents.length > 0) && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {selectedCount === documents.length && documents.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {documents.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {total === 0 ? (
              <p>{t("documents.noDocuments")}</p>
            ) : (
              <p>No documents match your filters</p>
            )}
          </div>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            onClick={() => handleSelectDocument(doc.docId)}
          >
            <input
              type="checkbox"
              checked={selectedDocs[doc.docId] || false}
              onChange={() => handleSelectDocument(doc.docId)}
              className="w-4 h-4 text-blue-600 rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {doc.filename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
            {isEmbedded && (
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                Embedded
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {loading && <PreLoader />}
        </div>
      )}

      {/* End message */}
      {!hasMore && documents.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          All {total} documents loaded
        </div>
      )}
    </div>
  );
}
