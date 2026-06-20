/**
 * Connection State Machine
 * Manages WebSocket connection lifecycle with validation and transitions
 */

import { WS_STATES, EVENTS } from './WebSocketConfig.js';

class ConnectionStateMachine {
  constructor() {
    this.state = WS_STATES.DISCONNECTED;
    this.observers = [];
    this.transitionHistory = [];
    this.lastStateChangeTime = Date.now();

    // Define valid state transitions
    this.validTransitions = {
      [WS_STATES.DISCONNECTED]: [
        WS_STATES.CONNECTING,
        WS_STATES.CLOSED,
      ],
      [WS_STATES.CONNECTING]: [
        WS_STATES.CONNECTED,
        WS_STATES.FAILED,
        WS_STATES.DISCONNECTED,
      ],
      [WS_STATES.CONNECTED]: [
        WS_STATES.DISCONNECTED,
        WS_STATES.FAILED,
        WS_STATES.RECONNECTING,
        WS_STATES.CLOSED,
      ],
      [WS_STATES.RECONNECTING]: [
        WS_STATES.CONNECTED,
        WS_STATES.FAILED,
        WS_STATES.DISCONNECTED,
        WS_STATES.CLOSED,
      ],
      [WS_STATES.FAILED]: [
        WS_STATES.RECONNECTING,
        WS_STATES.DISCONNECTED,
        WS_STATES.CLOSED,
      ],
      [WS_STATES.CLOSED]: [
        WS_STATES.DISCONNECTED, // Allow restart after close
      ],
    };
  }

  /**
   * Check if a transition is valid
   * @param {string} nextState - The state to transition to
   * @returns {boolean} True if transition is valid
   */
  canTransition(nextState) {
    const validNextStates = this.validTransitions[this.state] || [];
    return validNextStates.includes(nextState);
  }

  /**
   * Transition to a new state
   * @param {string} nextState - The state to transition to
   * @param {object} metadata - Optional metadata about the transition
   * @returns {boolean} True if transition was successful
   */
  transition(nextState, metadata = {}) {
    if (this.state === nextState) {
      // Already in this state, no transition needed
      return true;
    }

    if (!this.canTransition(nextState)) {
      console.warn(
        `Invalid state transition: ${this.state} -> ${nextState}. ` +
        `Valid next states: ${this.validTransitions[this.state].join(', ')}`
      );
      return false;
    }

    const previousState = this.state;
    const transitionTime = Date.now();
    const stateDuration = transitionTime - this.lastStateChangeTime;

    this.state = nextState;
    this.lastStateChangeTime = transitionTime;

    // Track transition history (keep last 50)
    this.transitionHistory.push({
      from: previousState,
      to: nextState,
      timestamp: transitionTime,
      duration: stateDuration,
      metadata,
    });
    if (this.transitionHistory.length > 50) {
      this.transitionHistory.shift();
    }

    // Notify observers
    this.notifyObservers({
      previousState,
      currentState: nextState,
      transitionTime,
      stateDuration,
      metadata,
    });

    return true;
  }

  /**
   * Get the current state
   * @returns {string} The current state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if connected or attempting to connect
   * @returns {boolean} True if in a connected/connecting state
   */
  isActive() {
    return [
      WS_STATES.CONNECTING,
      WS_STATES.CONNECTED,
      WS_STATES.RECONNECTING,
    ].includes(this.state);
  }

  /**
   * Check if fully connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.state === WS_STATES.CONNECTED;
  }

  /**
   * Check if in a failed state
   * @returns {boolean} True if failed or closed
   */
  isFailed() {
    return [WS_STATES.FAILED, WS_STATES.CLOSED].includes(this.state);
  }

  /**
   * Get the time spent in current state (milliseconds)
   * @returns {number} Duration in milliseconds
   */
  getCurrentStateDuration() {
    return Date.now() - this.lastStateChangeTime;
  }

  /**
   * Subscribe to state changes
   * @param {Function} observer - Callback function for state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }

  /**
   * Notify all observers of state change
   * @private
   */
  notifyObservers(transitionInfo) {
    this.observers.forEach(observer => {
      try {
        observer(transitionInfo);
      } catch (error) {
        console.error('Observer notification error:', error);
      }
    });
  }

  /**
   * Get transition history
   * @returns {Array} Array of recent transitions
   */
  getHistory() {
    return [...this.transitionHistory];
  }

  /**
   * Reset the state machine
   * @param {boolean} notifyObservers - Whether to notify observers
   */
  reset(notifyObservers = false) {
    this.state = WS_STATES.DISCONNECTED;
    this.lastStateChangeTime = Date.now();
    this.transitionHistory = [];
    this.observers = [];
  }

  /**
   * Get debug info about current state
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      currentState: this.state,
      isActive: this.isActive(),
      isConnected: this.isConnected(),
      isFailed: this.isFailed(),
      stateDuration: this.getCurrentStateDuration(),
      observerCount: this.observers.length,
      historyLength: this.transitionHistory.length,
      lastTransition: this.transitionHistory[this.transitionHistory.length - 1] || null,
    };
  }
}

// Export singleton instance
export const connectionStateMachine = new ConnectionStateMachine();

export default ConnectionStateMachine;
