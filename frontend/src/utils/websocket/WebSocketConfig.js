/**
 * WebSocket configuration constants and enums
 * Centralized configuration for all WebSocket connections
 */

export const WS_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  FAILED: 'FAILED',
  CLOSED: 'CLOSED',
};

export const MESSAGE_TYPES = {
  // Stream events
  REPORT_STREAM_EVENT: 'reportStreamEvent',
  TEXT_RESPONSE_CHUNK: 'textResponseChunk',
  FULL_TEXT_RESPONSE: 'fullTextResponse',
  TOOL_CALL_INVOCATION: 'toolCallInvocation',
  USAGE_METRICS: 'usageMetrics',
  CITATIONS: 'citations',
  CHAT_ID: 'chatId',
  MODEL_ROUTE_NOTIFICATION: 'modelRouteNotification',

  // Card types
  FILE_DOWNLOAD: 'fileDownloadCard',
  RECHART_VISUALIZE: 'rechartVisualize',

  // Interactive
  TOOL_APPROVAL: 'toolApprovalRequest',
  CLARIFICATION: 'clarificationRequest',
  AWAITING_FEEDBACK: 'awaitingFeedback',

  // Status
  STATUS_RESPONSE: 'statusResponse',
  WSS_FAILURE: 'wssFailure',

  // Control
  RENAME_THREAD: 'rename_thread',
};

export const TIMEOUTS = {
  // Connection timeouts
  SOCKET_CONNECT_TIMEOUT_MS: 10000, // 10 seconds
  SOCKET_MESSAGE_TIMEOUT_MS: 30000, // 30 seconds
  SOCKET_SESSION_TIMEOUT_MS: 300000, // 5 minutes

  // Interactive request timeouts
  TOOL_APPROVAL_TIMEOUT_MS: 120000, // 2 minutes
  CLARIFICATION_TIMEOUT_MS: 120000, // 2 minutes
  FEEDBACK_TIMEOUT_MS: 300000, // 5 minutes
};

export const RECONNECTION = {
  // Exponential backoff configuration
  INITIAL_DELAY_MS: 1000, // 1 second
  MAX_DELAY_MS: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2, // Double each retry
  JITTER_PERCENT: 10, // ±10% randomization

  // Retry limits
  MAX_RETRY_ATTEMPTS: 12, // ~4 minutes total with backoff
  HEALTH_CHECK_INTERVAL_MS: 10000, // 10 seconds
};

export const QUEUE = {
  // Message queue configuration
  MAX_QUEUE_SIZE: 100, // Maximum messages in queue
  MAX_QUEUE_MEMORY_MB: 1, // Maximum 1MB of queued messages
  BATCH_SIZE: 10, // Process 10 messages at a time
  BATCH_INTERVAL_MS: 500, // Every 500ms
};

export const LATENCY = {
  // Latency monitoring
  MOVING_AVERAGE_WINDOW: 10, // Track last 10 messages
  WARNING_THRESHOLD_MS: 500, // Warn if RTT > 500ms
  CRITICAL_THRESHOLD_MS: 2000, // Critical if RTT > 2s
};

export const EVENTS = {
  // Internal event names
  STATE_CHANGED: 'ws:stateChanged',
  MESSAGE_SENT: 'ws:messageSent',
  MESSAGE_RECEIVED: 'ws:messageReceived',
  ERROR_OCCURRED: 'ws:errorOccurred',
  RECONNECT_STARTED: 'ws:reconnectStarted',
  RECONNECT_SUCCESS: 'ws:reconnectSuccess',
  RECONNECT_FAILED: 'ws:reconnectFailed',
  LATENCY_WARNING: 'ws:latencyWarning',
  CONNECTION_LOST: 'ws:connectionLost',
};

// Legacy window event names (maintained for backward compatibility)
export const LEGACY_EVENTS = {
  AGENT_SESSION_START: 'agentSessionStart',
  AGENT_SESSION_END: 'agentSessionEnd',
  ABORT_STREAM: 'abortStream',
  CLEAR_ATTACHMENTS: 'clearAttachments',
};

export const MESSAGE_FILTERING = {
  // Default filter patterns
  EXCLUDE_EMPTY_CONTENT: true,
  REMOVE_PENDING_MESSAGES: false, // Keep pending messages visible during load
};

export const SERIALIZATION = {
  // Serialization configuration
  MAX_MESSAGE_SIZE_KB: 512, // Maximum 512KB per message
  COMPRESSION_ENABLED: false, // Can enable for large payloads
  SAFE_JSON_PARSE_ENABLED: true, // Use safe JSON parsing
};
