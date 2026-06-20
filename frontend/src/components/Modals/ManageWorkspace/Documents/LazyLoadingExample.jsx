/**
 * Example: How to integrate lazy loading with existing document management
 *
 * This file demonstrates how to use the new lazy loading functionality
 * in the existing DocumentSettings component for workspaces with many documents.
 */

import { useCallback, useEffect, useRef } from "react";
import useWorkspaceDocuments from "@/hooks/useWorkspaceDocuments";
import LazyDocumentBrowser from "./LazyDocumentBrowser";

/**
 * Enhanced DocumentSettings component with lazy loading support
 *
 * This component shows how to integrate the new LazyDocumentBrowser
 * for workspaces with many documents (100+).
 */
export function EnhancedDocumentSettings({ workspace }) {
  const {
    documents,
    loading,
    hasMore,
    total,
    sortBy,
    setSortBy,
    filterType,
    setFilterType,
    loadMore,
    error,
  } = useWorkspaceDocuments(workspace.id, 50);

  const observerTarget = useRef(null);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadMore]);

  const handleSelectDocuments = useCallback((selectedDocs) => {
    // Handle selected documents - this would integrate with existing
    // workspace embedding logic
    console.log("Selected documents:", selectedDocs);
  }, []);

  return (
    <div className="document-settings">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents</h2>
        <span className="text-sm text-gray-600">Total: {total}</span>
      </div>

      {/* Use the new lazy-loading component */}
      <LazyDocumentBrowser
        workspaceId={workspace.id}
        onSelectDocuments={handleSelectDocuments}
        isEmbedded={false}
      />

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {loading && <div className="animate-spin">Loading...</div>}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Integration guide:
 *
 * 1. Replace the old document loading in DocumentSettings:
 *    OLD: const localFiles = await System.localFiles();
 *    NEW: Use useWorkspaceDocuments() hook
 *
 * 2. Replace the document browser component:
 *    OLD: <Directory documents={availableDocs} />
 *    NEW: <LazyDocumentBrowser workspaceId={workspace.id} />
 *
 * 3. Handle selection:
 *    OLD: Use local state for selectedItems
 *    NEW: Use onSelectDocuments callback
 *
 * Benefits:
 * - Automatically loads documents on demand
 * - Supports filtering and sorting
 * - Infinite scroll automatically loads more
 * - Significantly faster for large workspaces
 * - Better memory efficiency
 *
 * Backward compatibility:
 * - Old components still work unchanged
 * - Migration is optional
 * - Gradual rollout supported
 */

export default EnhancedDocumentSettings;
