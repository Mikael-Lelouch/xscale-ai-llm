/**
 * Latency Monitor
 * Tracks round-trip time (RTT) and network performance metrics
 */

import { LATENCY } from './WebSocketConfig.js';

class LatencyMonitor {
  constructor() {
    this.measurements = [];
    this.pendingMessages = new Map(); // Track messages waiting for responses
    this.observers = [];
  }

  /**
   * Record a message being sent
   * @param {string} messageId - Unique message identifier
   * @param {object} metadata - Optional metadata about the message
   */
  recordSent(messageId, metadata = {}) {
    this.pendingMessages.set(messageId, {
      sentTime: Date.now(),
      metadata,
    });
  }

  /**
   * Record a message response being received
   * @param {string} messageId - Unique message identifier that was sent
   * @returns {number|null} RTT in milliseconds, or null if no matching sent message
   */
  recordReceived(messageId) {
    const pending = this.pendingMessages.get(messageId);
    if (!pending) {
      return null;
    }

    const rtt = Date.now() - pending.sentTime;
    this.pendingMessages.delete(messageId);

    // Add measurement
    this.measurements.push({
      messageId,
      rtt,
      timestamp: Date.now(),
      metadata: pending.metadata,
    });

    // Keep only the last N measurements
    if (this.measurements.length > LATENCY.MOVING_AVERAGE_WINDOW) {
      this.measurements.shift();
    }

    // Check thresholds and notify if needed
    this.checkThresholds(rtt);

    return rtt;
  }

  /**
   * Check if latency exceeds warning/critical thresholds
   * @private
   */
  checkThresholds(rtt) {
    if (rtt > LATENCY.CRITICAL_THRESHOLD_MS) {
      this.notifyObservers({
        type: 'critical',
        rtt,
        threshold: LATENCY.CRITICAL_THRESHOLD_MS,
      });
    } else if (rtt > LATENCY.WARNING_THRESHOLD_MS) {
      this.notifyObservers({
        type: 'warning',
        rtt,
        threshold: LATENCY.WARNING_THRESHOLD_MS,
      });
    }
  }

  /**
   * Get average RTT from recent measurements
   * @returns {number} Average RTT in milliseconds
   */
  getAverageRTT() {
    if (this.measurements.length === 0) {
      return 0;
    }

    const sum = this.measurements.reduce((total, m) => total + m.rtt, 0);
    return Math.round(sum / this.measurements.length);
  }

  /**
   * Get median RTT
   * @returns {number} Median RTT in milliseconds
   */
  getMedianRTT() {
    if (this.measurements.length === 0) {
      return 0;
    }

    const sorted = [...this.measurements]
      .map(m => m.rtt)
      .sort((a, b) => a - b);

    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  /**
   * Get percentile RTT
   * @param {number} percentile - 0-100 percentile value
   * @returns {number} RTT at given percentile in milliseconds
   */
  getPercentileRTT(percentile) {
    if (this.measurements.length === 0) {
      return 0;
    }

    const sorted = [...this.measurements]
      .map(m => m.rtt)
      .sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Get min and max RTT
   * @returns {object} Object with min and max properties
   */
  getMinMaxRTT() {
    if (this.measurements.length === 0) {
      return { min: 0, max: 0 };
    }

    const rtts = this.measurements.map(m => m.rtt);
    return {
      min: Math.min(...rtts),
      max: Math.max(...rtts),
    };
  }

  /**
   * Get standard deviation of RTT
   * @returns {number} Standard deviation in milliseconds
   */
  getStandardDeviation() {
    if (this.measurements.length < 2) {
      return 0;
    }

    const avg = this.getAverageRTT();
    const variance = this.measurements.reduce((sum, m) => {
      return sum + Math.pow(m.rtt - avg, 2);
    }, 0) / this.measurements.length;

    return Math.round(Math.sqrt(variance));
  }

  /**
   * Get most recent measurements
   * @param {number} count - Number of recent measurements to return
   * @returns {Array} Array of measurement objects
   */
  getRecentMeasurements(count = 10) {
    return this.measurements.slice(-count);
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.measurements = [];
    this.pendingMessages.clear();
  }

  /**
   * Subscribe to latency threshold events
   * @param {Function} observer - Callback for threshold breaches
   * @returns {Function} Unsubscribe function
   */
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }

  /**
   * Notify observers of latency events
   * @private
   */
  notifyObservers(event) {
    this.observers.forEach(observer => {
      try {
        observer(event);
      } catch (error) {
        console.error('Latency monitor observer error:', error);
      }
    });
  }

  /**
   * Get comprehensive performance metrics
   * @returns {object} Complete metrics object
   */
  getMetrics() {
    const { min, max } = this.getMinMaxRTT();

    return {
      count: this.measurements.length,
      average: this.getAverageRTT(),
      median: this.getMedianRTT(),
      p95: this.getPercentileRTT(95),
      p99: this.getPercentileRTT(99),
      min,
      max,
      stdDev: this.getStandardDeviation(),
      pendingCount: this.pendingMessages.size,
    };
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    const metrics = this.getMetrics();
    return {
      ...metrics,
      warningThreshold: LATENCY.WARNING_THRESHOLD_MS,
      criticalThreshold: LATENCY.CRITICAL_THRESHOLD_MS,
      windowSize: LATENCY.MOVING_AVERAGE_WINDOW,
      observerCount: this.observers.length,
      lastMeasurement: this.measurements[this.measurements.length - 1] || null,
    };
  }
}

export default LatencyMonitor;
