/**
 * WebSocket Manager
 * Central orchestration for WebSocket connections with reconnection,
 * message queuing, and latency monitoring
 */

import {
  WS_STATES,
  MESSAGE_TYPES,
  EVENTS,
  LEGACY_EVENTS,
  TIMEOUTS,
} from './WebSocketConfig.js';
import ConnectionStateMachine from './connectionStateMachine.js';
import ReconnectionManager from './reconnectionManager.js';
import MessageQueue from './messageQueue.js';
import LatencyMonitor from './latencyMonitor.js';
import { websocketURI } from '../chat/agent.js'; // Maintain existing utility

let instance = null;

class WebSocketManager {
  constructor() {
    if (instance) {
      return instance;
    }

    this.socket = null;
    this.socketId = null;
    this.workspaceSlug = null;
    this.threadSlug = null;

    // Core sub-systems
    this.stateMachine = new ConnectionStateMachine();
    this.reconnectionManager = new ReconnectionManager(() => this.reconnect());
    this.messageQueue = new MessageQueue();
    this.latencyMonitor = new LatencyMonitor();

    // Message handlers
    this.messageHandlers = new Map();
    this.messageObservers = [];

    // Event system
    this.eventObservers = new Map();

    // Lifecycle
    this.isShuttingDown = false;
    this.connectionTimestamp = null;

    // Message tracking
    this.messageIdCounter = 0;
    this.lastMessageTime = null;

    // Setup message queue to use our send method
    this.messageQueue.setSendFunction((message) => this.send(message));

    instance = this;
  }

  /**
   * Connect to WebSocket server
   * @param {string} socketId - The invocation socket ID
   * @param {string} workspaceSlug - Workspace identifier
   * @param {string} threadSlug - Optional thread identifier
   * @returns {Promise<boolean>} True if connection successful
   */
  async connect(socketId, workspaceSlug, threadSlug = null) {
    if (this.isShuttingDown) {
      console.warn('WebSocket manager is shutting down, cannot connect');
      return false;
    }

    // Don't create multiple connections for same socket
    if (this.socket && this.socketId === socketId && this.stateMachine.isConnected()) {
      return true;
    }

    this.socketId = socketId;
    this.workspaceSlug = workspaceSlug;
    this.threadSlug = threadSlug;

    return this.createConnection();
  }

  /**
   * Create WebSocket connection
   * @private
   */
  async createConnection() {
    try {
      this.stateMachine.transition(WS_STATES.CONNECTING, { socketId: this.socketId });
      this.emit(EVENTS.STATE_CHANGED, {
        state: WS_STATES.CONNECTING,
      });

      const wsUrl = `${websocketURI()}/api/agent-invocation/${this.socketId}`;
      this.socket = new WebSocket(wsUrl);

      // Setup socket event handlers
      this.socket.addEventListener('open', () => this.handleOpen());
      this.socket.addEventListener('message', (event) => this.handleMessage(event));
      this.socket.addEventListener('error', (event) => this.handleError(event));
      this.socket.addEventListener('close', (event) => this.handleClose(event));

      return true;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.stateMachine.transition(WS_STATES.FAILED);
      this.emit(EVENTS.ERROR_OCCURRED, { error: error.message });
      return false;
    }
  }

  /**
   * Handle socket open event
   * @private
   */
  handleOpen() {
    console.log('WebSocket connected');
    this.connectionTimestamp = Date.now();
    this.reconnectionManager.reset();

    this.stateMachine.transition(WS_STATES.CONNECTED);
    this.emit(EVENTS.STATE_CHANGED, { state: WS_STATES.CONNECTED });

    // Emit legacy events for backward compatibility
    window.dispatchEvent(new CustomEvent(LEGACY_EVENTS.AGENT_SESSION_START));

    // Process any queued messages
    if (!this.messageQueue.isEmpty()) {
      this.messageQueue.processBatch();
    }
  }

  /**
   * Handle incoming socket message
   * @private
   */
  async handleMessage(event) {
    try {
      const data = this.parseMessage(event.data);
      if (!data) return;

      this.emit(EVENTS.MESSAGE_RECEIVED, { data });

      // Update latency if this is a response to a pending message
      if (data.id) {
        this.latencyMonitor.recordReceived(data.id);
      }

      // Dispatch to registered handlers
      const handlers = this.getHandlersForMessage(data);
      for (const handler of handlers) {
        try {
          await handler(data);
        } catch (error) {
          console.error('Message handler error:', error, data);
        }
      }

      this.lastMessageTime = Date.now();
    } catch (error) {
      console.error('Failed to handle socket message:', error);
    }
  }

  /**
   * Handle socket error
   * @private
   */
  handleError(event) {
    console.error('WebSocket error:', event);
    this.emit(EVENTS.ERROR_OCCURRED, { error: event.message });
  }

  /**
   * Handle socket close event
   * @private
   */
  handleClose(event) {
    console.log('WebSocket closed', { code: event.code, reason: event.reason });

    if (this.isShuttingDown) {
      this.stateMachine.transition(WS_STATES.CLOSED);
    } else {
      this.stateMachine.transition(WS_STATES.DISCONNECTED);
      this.emit(EVENTS.CONNECTION_LOST, { code: event.code });

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && event.code !== 1001) {
        this.scheduleReconnect();
      }
    }

    // Emit legacy events for backward compatibility
    window.dispatchEvent(new CustomEvent(LEGACY_EVENTS.AGENT_SESSION_END));

    this.socket = null;
  }

  /**
   * Send a message through the WebSocket
   * @param {object} message - Message to send
   * @param {string} messageId - Optional message ID for latency tracking
   * @returns {boolean} True if message was sent or queued
   */
  send(message, messageId = null) {
    if (!messageId) {
      messageId = this.generateMessageId();
    }

    // Attach message ID for tracking
    const envelope = { ...message, id: messageId };

    this.emit(EVENTS.MESSAGE_SENT, { message: envelope });
    this.latencyMonitor.recordSent(messageId, { type: message.type });

    if (this.stateMachine.isConnected() && this.socket) {
      try {
        this.socket.send(JSON.stringify(envelope));
        return true;
      } catch (error) {
        console.warn('Failed to send message, queueing:', error);
        // Fall through to queue
      }
    }

    // Queue for later delivery
    return this.messageQueue.enqueue(envelope);
  }

  /**
   * Reconnect after disconnection
   * @private
   */
  reconnect() {
    if (this.isShuttingDown) return;

    if (!this.socketId || !this.workspaceSlug) {
      console.warn('Cannot reconnect: missing socket ID or workspace slug');
      return;
    }

    this.stateMachine.transition(WS_STATES.RECONNECTING);
    this.emit(EVENTS.RECONNECT_STARTED, {
      attempt: this.reconnectionManager.getRetryCount(),
    });

    this.createConnection().then((success) => {
      if (success) {
        this.emit(EVENTS.RECONNECT_SUCCESS);
      } else {
        this.scheduleReconnect();
      }
    });
  }

  /**
   * Schedule a reconnection attempt
   * @private
   */
  scheduleReconnect() {
    const delay = this.reconnectionManager.scheduleReconnect(this.stateMachine);
    if (delay === null) {
      this.stateMachine.transition(WS_STATES.FAILED);
      this.emit(EVENTS.RECONNECT_FAILED, {
        reason: 'Max reconnection attempts exceeded',
      });
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.isShuttingDown = true;
    this.reconnectionManager.cancel();
    this.messageQueue.clear();
    this.latencyMonitor.clear();

    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnect');
      } catch (error) {
        console.warn('Error closing socket:', error);
      }
    }

    this.stateMachine.transition(WS_STATES.CLOSED);
    this.emit(EVENTS.STATE_CHANGED, { state: WS_STATES.CLOSED });
  }

  /**
   * Get current connection state
   * @returns {string} Current state
   */
  getState() {
    return this.stateMachine.getState();
  }

  /**
   * Check if connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.stateMachine.isConnected();
  }

  /**
   * Register a message handler
   * @param {string} messageType - Message type to handle
   * @param {Function} handler - Handler function
   * @returns {Function} Unregister function
   */
  registerHandler(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }

    const handlers = this.messageHandlers.get(messageType);
    handlers.push(handler);

    // Return unregister function
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Get handlers for a message
   * @private
   */
  getHandlersForMessage(data) {
    const handlers = [];

    // Get specific type handlers
    if (data.type) {
      handlers.push(...(this.messageHandlers.get(data.type) || []));
    }

    // Get wildcard handlers
    handlers.push(...(this.messageHandlers.get('*') || []));

    return handlers;
  }

  /**
   * Subscribe to manager events
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.eventObservers.has(eventType)) {
      this.eventObservers.set(eventType, []);
    }

    const callbacks = this.eventObservers.get(eventType);
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   * @private
   */
  emit(eventType, data = {}) {
    const callbacks = this.eventObservers.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event handler error for ${eventType}:`, error);
      }
    });
  }

  /**
   * Parse incoming message data
   * @private
   */
  parseMessage(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse message:', error);
      return null;
    }
  }

  /**
   * Generate a unique message ID
   * @private
   */
  generateMessageId() {
    return `msg-${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Get performance metrics
   * @returns {object} Metrics object
   */
  getMetrics() {
    return {
      connection: {
        state: this.getState(),
        connected: this.isConnected(),
        uptime: this.connectionTimestamp ? Date.now() - this.connectionTimestamp : 0,
      },
      latency: this.latencyMonitor.getMetrics(),
      queue: this.messageQueue.getDebugInfo(),
      reconnection: this.reconnectionManager.getDebugInfo(),
    };
  }

  /**
   * Get debug information
   * @returns {object} Debug info
   */
  getDebugInfo() {
    return {
      stateMachine: this.stateMachine.getDebugInfo(),
      reconnection: this.reconnectionManager.getDebugInfo(),
      queue: this.messageQueue.getDebugInfo(),
      latency: this.latencyMonitor.getDebugInfo(),
      socket: {
        url: this.socket?.url,
        readyState: this.socket?.readyState,
      },
      metadata: {
        socketId: this.socketId,
        workspaceSlug: this.workspaceSlug,
        threadSlug: this.threadSlug,
        isShuttingDown: this.isShuttingDown,
        lastMessageTime: this.lastMessageTime,
      },
    };
  }

  /**
   * Reset the manager (for testing/cleanup)
   */
  reset() {
    this.disconnect();
    this.socket = null;
    this.socketId = null;
    this.workspaceSlug = null;
    this.threadSlug = null;
    this.isShuttingDown = false;
    this.connectionTimestamp = null;
    this.lastMessageTime = null;
    this.messageIdCounter = 0;
    this.messageHandlers.clear();
    this.messageObservers = [];
    this.eventObservers.clear();
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();

export default WebSocketManager;
