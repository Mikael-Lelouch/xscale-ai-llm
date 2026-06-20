import { useState, useEffect } from "react";
import System from "@/models/system";

/**
 * Custom hook to fetch and manage deployment mode state
 * Handles fetching, caching, and loading/error states
 *
 * @returns {object} { mode, isLoading, error, details, refresh }
 * - mode: 'local' | 'cloud-eu' | 'cloud-us'
 * - isLoading: boolean indicating fetch in progress
 * - error: Error message or null
 * - details: Additional deployment information
 * - refresh: Function to manually refresh deployment mode
 */
export function useDeploymentMode() {
  const [mode, setMode] = useState("cloud-us");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState({});

  const fetchMode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await System.fetchDeploymentMode();

      setMode(result.mode || "cloud-us");
      setDetails(result.details || {});

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Failed to detect deployment mode");
      setMode("cloud-us");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMode();
  }, []);

  return {
    mode,
    isLoading,
    error,
    details,
    refresh: fetchMode,
  };
}

/**
 * Hook that returns the deployment mode as a string
 * Simpler variant for when you just need the mode
 *
 * @returns {string} Deployment mode: 'local' | 'cloud-eu' | 'cloud-us'
 */
export function useDeploymentModeString() {
  const { mode } = useDeploymentMode();
  return mode;
}

export default useDeploymentMode;
