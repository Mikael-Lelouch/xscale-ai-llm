/**
 * WebSocket Module Index
 * Exports all WebSocket utilities for use in the application
 */

// Core manager
export { websocketManager, default as WebSocketManager } from './WebSocketManager.js';

// Configuration
export {
  WS_STATES,
  MESSAGE_TYPES,
  TIMEOUTS,
  RECONNECTION,
  QUEUE,
  LATENCY,
  EVENTS,
  LEGACY_EVENTS,
  MESSAGE_FILTERING,
  SERIALIZATION,
} from './WebSocketConfig.js';

// Sub-systems
export { connectionStateMachine, default as ConnectionStateMachine } from './connectionStateMachine.js';
export { default as ReconnectionManager } from './reconnectionManager.js';
export { default as MessageQueue } from './messageQueue.js';
export { default as LatencyMonitor } from './latencyMonitor.js';

// Message handling
export { messageHandlerRegistry, default as MessageHandlerRegistry } from './messageHandlers/index.js';
