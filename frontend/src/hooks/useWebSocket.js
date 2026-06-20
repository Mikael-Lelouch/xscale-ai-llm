/**
 * useWebSocket Hook
 * React hook for managing WebSocket connections with automatic lifecycle
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { websocketManager } from '@/utils/websocket/WebSocketManager';
import { messageHandlerRegistry } from '@/utils/websocket/messageHandlers';
import { WS_STATES, EVENTS } from '@/utils/websocket/WebSocketConfig';

/**
 * Hook for managing WebSocket connections
 * @param {string} socketId - WebSocket connection ID
 * @param {string} workspaceSlug - Workspace identifier
 * @param {string} threadSlug - Optional thread identifier
 * @param {Function} setChatHistory - React setState for chat history
 * @returns {object} Hook state and methods
 */
export function useWebSocket(socketId, workspaceSlug, threadSlug, setChatHistory) {
  const [state, setState] = useState(WS_STATES.DISCONNECTED);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const unsubscribesRef = useRef([]);
  const isInitializedRef = useRef(false);

  // Register message handler for setChatHistory
  useEffect(() => {
    if (!setChatHistory) return;

    const unsubscribe = websocketManager.registerHandler('*', async (data) => {
      try {
        await messageHandlerRegistry.handle(data, {
          setChatHistory,
          socket: websocketManager.socket,
          emit: (eventType, eventData) => {
            // Can emit events if needed
          },
        });
      } catch (err) {
        console.error('Message handler error:', err);
      }
    });

    return unsubscribe;
  }, [setChatHistory]);

  // Setup event listeners for state/metrics updates
  useEffect(() => {
    const unsubscribes = [];

    // Listen for state changes
    const unsubState = websocketManager.subscribe(EVENTS.STATE_CHANGED, ({ state: newState }) => {
      setState(newState);
    });
    unsubscribes.push(unsubState);

    // Listen for reconnection start
    const unsubReconnect = websocketManager.subscribe(EVENTS.RECONNECT_STARTED, ({ attempt }) => {
      setState(WS_STATES.RECONNECTING);
    });
    unsubscribes.push(unsubReconnect);

    // Listen for errors
    const unsubError = websocketManager.subscribe(EVENTS.ERROR_OCCURRED, ({ error: err }) => {
      setError(err);
    });
    unsubscribes.push(unsubError);

    // Periodic metrics update
    const metricsInterval = setInterval(() => {
      setMetrics(websocketManager.getMetrics());
    }, 1000);

    return () => {
      unsubscribes.forEach(fn => fn());
      clearInterval(metricsInterval);
    };
  }, []);

  // Connect effect
  useEffect(() => {
    if (!socketId || !workspaceSlug || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    (async () => {
      try {
        const success = await websocketManager.connect(socketId, workspaceSlug, threadSlug);
        if (!success) {
          setError('Failed to establish WebSocket connection');
        }
      } catch (err) {
        setError(err.message);
      }
    })();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - let the manager handle reconnection
      // This prevents interrupting agent execution when component re-renders
    };
  }, [socketId, workspaceSlug, threadSlug]);

  // Send message callback
  const send = useCallback((message, messageId = null) => {
    return websocketManager.send(message, messageId);
  }, []);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return websocketManager.getMetrics();
  }, []);

  // Get debug info
  const getDebugInfo = useCallback(() => {
    return websocketManager.getDebugInfo();
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (socketId && workspaceSlug) {
      websocketManager.connect(socketId, workspaceSlug, threadSlug);
    }
  }, [socketId, workspaceSlug, threadSlug]);

  // Disconnect
  const disconnect = useCallback(() => {
    websocketManager.disconnect();
  }, []);

  return {
    // State
    state,
    connected: state === WS_STATES.CONNECTED,
    connecting: state === WS_STATES.CONNECTING,
    reconnecting: state === WS_STATES.RECONNECTING,
    failed: state === WS_STATES.FAILED,
    error,

    // Methods
    send,
    reconnect,
    disconnect,
    getMetrics,
    getDebugInfo,

    // Metrics
    metrics,
  };
}

export default useWebSocket;
