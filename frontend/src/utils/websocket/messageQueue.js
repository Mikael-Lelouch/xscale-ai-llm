/**
 * Message Queue
 * Handles offline message buffering and processing with disk persistence
 */

import { QUEUE } from './WebSocketConfig.js';

const STORAGE_KEY = 'xscale-ws-queue';

class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.onSend = null;
    this.batchTimer = null;

    // Try to restore from storage
    this.restoreFromStorage();
  }

  /**
   * Add a message to the queue
   * @param {object} message - Message to queue
   * @param {boolean} urgent - If true, process immediately
   * @returns {boolean} True if queued successfully
   */
  enqueue(message, urgent = false) {
    // Check queue size limits
    if (this.queue.length >= QUEUE.MAX_QUEUE_SIZE) {
      console.warn('Message queue is full, dropping oldest message');
      this.queue.shift();
    }

    const estimatedSize = this.estimateMessageSize(message);
    const currentSize = this.getTotalQueueSize();
    const maxSizeBytes = QUEUE.MAX_QUEUE_MEMORY_MB * 1024 * 1024;

    if (currentSize + estimatedSize > maxSizeBytes) {
      console.warn('Message queue memory limit exceeded, dropping oldest message');
      this.queue.shift();
    }

    const queueItem = {
      id: this.generateId(),
      message,
      timestamp: Date.now(),
      retries: 0,
      urgent,
    };

    this.queue.push(queueItem);
    this.saveToStorage();

    if (urgent) {
      this.processBatch();
    } else {
      this.scheduleBatchProcessing();
    }

    return true;
  }

  /**
   * Process queued messages in batches
   * @param {Function} sendFn - Function to call to send messages
   * @returns {Promise<void>}
   */
  async processBatch(sendFn = this.onSend) {
    if (!sendFn) {
      console.warn('No send function provided for message queue processing');
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, QUEUE.BATCH_SIZE);

        for (const queueItem of batch) {
          try {
            await sendFn(queueItem.message);
            // Message sent successfully
          } catch (error) {
            // Re-queue the failed message (at the beginning)
            queueItem.retries++;
            if (queueItem.retries > 3) {
              console.error('Message queue item failed after 3 retries:', queueItem.message);
            } else {
              this.queue.unshift(queueItem);
            }
          }
        }

        // Wait before processing next batch
        if (this.queue.length > 0) {
          await this.delay(QUEUE.BATCH_INTERVAL_MS);
        }
      }
    } finally {
      this.isProcessing = false;
      this.saveToStorage();
    }
  }

  /**
   * Schedule batch processing with debouncing
   * @private
   */
  scheduleBatchProcessing() {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.processBatch();
    }, QUEUE.BATCH_INTERVAL_MS);
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.saveToStorage();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get queue size
   * @returns {number} Number of messages in queue
   */
  getSize() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   * @returns {boolean} True if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Get total queue memory usage in bytes
   * @returns {number} Bytes used by queue
   */
  getTotalQueueSize() {
    return this.queue.reduce((total, item) => {
      return total + this.estimateMessageSize(item.message);
    }, 0);
  }

  /**
   * Estimate message size in bytes
   * @private
   */
  estimateMessageSize(message) {
    try {
      return JSON.stringify(message).length;
    } catch {
      return 1024; // Estimate 1KB if serialization fails
    }
  }

  /**
   * Generate a unique ID for queue items
   * @private
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save queue to storage for persistence
   * @private
   */
  saveToStorage() {
    try {
      if (typeof sessionStorage === 'undefined') {
        return;
      }
      const serialized = JSON.stringify(this.queue);
      sessionStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('Failed to save message queue to storage:', error);
    }
  }

  /**
   * Restore queue from storage
   * @private
   */
  restoreFromStorage() {
    try {
      if (typeof sessionStorage === 'undefined') {
        return;
      }
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to restore message queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      queueSize: this.queue.length,
      memoryUsage: `${Math.round(this.getTotalQueueSize() / 1024)}KB`,
      isProcessing: this.isProcessing,
      batchScheduled: this.batchTimer !== null,
      maxSize: QUEUE.MAX_QUEUE_SIZE,
      maxMemoryMB: QUEUE.MAX_QUEUE_MEMORY_MB,
      oldestMessage: this.queue[0] ? {
        timestamp: this.queue[0].timestamp,
        age: Date.now() - this.queue[0].timestamp,
      } : null,
    };
  }

  /**
   * Set the send function to use for processing
   * @param {Function} sendFn - Function that sends a message
   */
  setSendFunction(sendFn) {
    this.onSend = sendFn;
  }
}

export default MessageQueue;
