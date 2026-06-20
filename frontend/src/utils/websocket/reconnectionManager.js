/**
 * Reconnection Manager
 * Implements exponential backoff with jitter for reliable reconnection
 */

import { RECONNECTION, WS_STATES } from './WebSocketConfig.js';

class ReconnectionManager {
  constructor(onReconnect) {
    this.onReconnect = onReconnect;
    this.retryCount = 0;
    this.nextRetryTime = null;
    this.retryTimer = null;
    this.isScheduled = false;
    this.backoffHistory = [];
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @param {number} attempt - The current retry attempt (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    // Exponential backoff: initial * multiplier ^ attempt
    let delay = RECONNECTION.INITIAL_DELAY_MS *
      Math.pow(RECONNECTION.BACKOFF_MULTIPLIER, attempt);

    // Cap at max delay
    delay = Math.min(delay, RECONNECTION.MAX_DELAY_MS);

    // Add jitter: ±percent randomization
    const jitterAmount = delay * (RECONNECTION.JITTER_PERCENT / 100);
    const jitter = (Math.random() * 2 - 1) * jitterAmount; // -jitterAmount to +jitterAmount
    delay = Math.max(delay + jitter, 1000); // Ensure at least 1 second

    return Math.round(delay);
  }

  /**
   * Schedule a reconnection attempt
   * @param {Function} stateMachine - State machine to check current state
   * @returns {number} Delay until next retry, or null if max attempts reached
   */
  scheduleReconnect(stateMachine) {
    if (this.isScheduled) {
      return this.nextRetryTime;
    }

    if (this.retryCount >= RECONNECTION.MAX_RETRY_ATTEMPTS) {
      console.error(
        `Max reconnection attempts (${RECONNECTION.MAX_RETRY_ATTEMPTS}) exceeded`
      );
      return null;
    }

    const delay = this.calculateDelay(this.retryCount);
    this.nextRetryTime = delay;
    this.isScheduled = true;

    // Record backoff history
    this.backoffHistory.push({
      attempt: this.retryCount,
      delay,
      timestamp: Date.now(),
    });
    if (this.backoffHistory.length > 20) {
      this.backoffHistory.shift();
    }

    // Schedule the reconnect attempt
    this.retryTimer = setTimeout(() => {
      this.isScheduled = false;
      this.retryCount++;

      // Try to reconnect
      if (this.onReconnect) {
        try {
          this.onReconnect();
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
        }
      }
    }, delay);

    return delay;
  }

  /**
   * Cancel any scheduled reconnection
   */
  cancel() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.isScheduled = false;
  }

  /**
   * Reset the reconnection state
   * Called when connection is successfully re-established
   */
  reset() {
    this.cancel();
    this.retryCount = 0;
    this.nextRetryTime = null;
  }

  /**
   * Get current retry count
   * @returns {number} Current retry attempt
   */
  getRetryCount() {
    return this.retryCount;
  }

  /**
   * Get whether a reconnect is scheduled
   * @returns {boolean} True if reconnect is scheduled
   */
  isReconnectScheduled() {
    return this.isScheduled;
  }

  /**
   * Get time until next retry
   * @returns {number|null} Milliseconds until next retry, or null if not scheduled
   */
  getTimeUntilNextRetry() {
    if (!this.isScheduled || !this.retryTimer) {
      return null;
    }
    // This is an approximation; actual time may vary slightly
    return this.nextRetryTime;
  }

  /**
   * Get remaining attempts
   * @returns {number} Number of remaining attempts
   */
  getRemainingAttempts() {
    return Math.max(0, RECONNECTION.MAX_RETRY_ATTEMPTS - this.retryCount);
  }

  /**
   * Check if max attempts has been reached
   * @returns {boolean} True if max attempts exceeded
   */
  hasExhaustedRetries() {
    return this.retryCount >= RECONNECTION.MAX_RETRY_ATTEMPTS;
  }

  /**
   * Get backoff history for debugging
   * @returns {Array} Array of recent backoff calculations
   */
  getBackoffHistory() {
    return [...this.backoffHistory];
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      retryCount: this.retryCount,
      isScheduled: this.isScheduled,
      nextRetryDelayMs: this.nextRetryTime,
      remainingAttempts: this.getRemainingAttempts(),
      hasExhaustedRetries: this.hasExhaustedRetries(),
      backoffHistoryLength: this.backoffHistory.length,
      lastBackoffDelay: this.backoffHistory[this.backoffHistory.length - 1]?.delay || null,
    };
  }
}

export default ReconnectionManager;
