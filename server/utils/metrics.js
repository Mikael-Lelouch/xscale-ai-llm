const client = require("prom-client");

/**
 * Prometheus Metrics Module
 * Collects and exposes application metrics for monitoring and observability
 */

class MetricsCollector {
  static _instance;

  constructor() {
    if (MetricsCollector._instance) return MetricsCollector._instance;

    this.registry = new client.Registry();

    // Set default metrics collection
    client.collectDefaultMetrics({ register: this.registry });

    // HTTP Metrics
    this.httpRequestDuration = new client.Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request latency in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestCount = new client.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    this.activeRequests = new client.Gauge({
      name: "http_active_requests",
      help: "Number of active HTTP requests",
      registers: [this.registry],
    });

    // Error Metrics
    this.errorCount = new client.Counter({
      name: "xscale_errors_total",
      help: "Total number of errors by type",
      labelNames: ["error_type", "endpoint"],
      registers: [this.registry],
    });

    // Chat & LLM Metrics
    this.chatRequests = new client.Counter({
      name: "xscale_chat_requests_total",
      help: "Total number of chat requests",
      labelNames: ["workspace", "model"],
      registers: [this.registry],
    });

    this.inferenceLatency = new client.Histogram({
      name: "xscale_inference_duration_seconds",
      help: "LLM inference latency in seconds",
      labelNames: ["model", "provider"],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.inferenceTokens = new client.Counter({
      name: "xscale_inference_tokens_total",
      help: "Total tokens processed by LLM",
      labelNames: ["model", "provider", "token_type"],
      registers: [this.registry],
    });

    // Document Metrics
    this.documentsProcessed = new client.Counter({
      name: "xscale_documents_processed_total",
      help: "Total number of documents processed",
      labelNames: ["doc_type", "workspace"],
      registers: [this.registry],
    });

    this.documentProcessingDuration = new client.Histogram({
      name: "xscale_document_processing_duration_seconds",
      help: "Document processing duration in seconds",
      labelNames: ["doc_type"],
      buckets: [0.5, 1, 5, 10, 30, 60],
      registers: [this.registry],
    });

    // WebSocket Metrics
    this.websocketConnections = new client.Gauge({
      name: "xscale_websocket_connections",
      help: "Current active WebSocket connections",
      registers: [this.registry],
    });

    this.websocketMessages = new client.Counter({
      name: "xscale_websocket_messages_total",
      help: "Total WebSocket messages processed",
      labelNames: ["message_type"],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryDuration = new client.Histogram({
      name: "xscale_db_query_duration_seconds",
      help: "Database query latency in seconds",
      labelNames: ["operation", "table"],
      buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.dbQueryCount = new client.Counter({
      name: "xscale_db_queries_total",
      help: "Total number of database queries",
      labelNames: ["operation", "table"],
      registers: [this.registry],
    });

    this.slowQueryCount = new client.Counter({
      name: "xscale_slow_queries_total",
      help: "Total number of slow database queries (>100ms)",
      labelNames: ["operation", "table"],
      registers: [this.registry],
    });

    this.dbPoolAvailable = new client.Gauge({
      name: "xscale_db_pool_available_connections",
      help: "Number of available database connection pool connections",
      registers: [this.registry],
    });

    // Service Health Metrics
    this.serviceHealth = new client.Gauge({
      name: "xscale_service_health",
      help: "Service health status (1=up, 0=down)",
      labelNames: ["service"],
      registers: [this.registry],
    });

    this.serviceLatency = new client.Histogram({
      name: "xscale_service_latency_seconds",
      help: "Service latency in seconds",
      labelNames: ["service"],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Business Metrics
    this.userCount = new client.Gauge({
      name: "xscale_users_total",
      help: "Total number of users",
      registers: [this.registry],
    });

    this.workspaceCount = new client.Gauge({
      name: "xscale_workspaces_total",
      help: "Total number of workspaces",
      registers: [this.registry],
    });

    this.embeddings = new client.Counter({
      name: "xscale_embeddings_created_total",
      help: "Total number of embeddings created",
      labelNames: ["engine"],
      registers: [this.registry],
    });

    MetricsCollector._instance = this;
  }

  getRegistry() {
    return this.registry;
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method, route, statusCode, durationSeconds) {
    this.httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
    this.httpRequestCount.labels(method, route, statusCode).inc();
  }

  /**
   * Increment active requests
   */
  incrementActiveRequests() {
    this.activeRequests.inc();
  }

  /**
   * Decrement active requests
   */
  decrementActiveRequests() {
    this.activeRequests.dec();
  }

  /**
   * Record error
   */
  recordError(errorType, endpoint) {
    this.errorCount.labels(errorType, endpoint).inc();
  }

  /**
   * Record chat request
   */
  recordChatRequest(workspace, model) {
    this.chatRequests.labels(workspace || "default", model || "unknown").inc();
  }

  /**
   * Record LLM inference
   */
  recordInference(model, provider, durationSeconds, inputTokens = 0, outputTokens = 0) {
    this.inferenceLatency.labels(model, provider).observe(durationSeconds);
    if (inputTokens > 0) {
      this.inferenceTokens.labels(model, provider, "input").inc(inputTokens);
    }
    if (outputTokens > 0) {
      this.inferenceTokens.labels(model, provider, "output").inc(outputTokens);
    }
  }

  /**
   * Record document processing
   */
  recordDocumentProcessed(docType, workspace, durationSeconds) {
    this.documentsProcessed.labels(docType, workspace || "default").inc();
    if (durationSeconds) {
      this.documentProcessingDuration.labels(docType).observe(durationSeconds);
    }
  }

  /**
   * Set WebSocket connection count
   */
  setWebsocketConnections(count) {
    this.websocketConnections.set(count);
  }

  /**
   * Increment WebSocket message count
   */
  recordWebsocketMessage(messageType) {
    this.websocketMessages.labels(messageType).inc();
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(operation, table, durationSeconds) {
    this.dbQueryDuration.labels(operation, table).observe(durationSeconds);
    this.dbQueryCount.labels(operation, table).inc();

    // Flag slow queries
    if (durationSeconds > 0.1) {
      this.slowQueryCount.labels(operation, table).inc();
    }
  }

  /**
   * Set database pool available connections
   */
  setDatabasePoolAvailable(count) {
    this.dbPoolAvailable.set(count);
  }

  /**
   * Set service health
   */
  setServiceHealth(service, healthy) {
    this.serviceHealth.labels(service).set(healthy ? 1 : 0);
  }

  /**
   * Record service latency
   */
  recordServiceLatency(service, durationSeconds) {
    this.serviceLatency.labels(service).observe(durationSeconds);
  }

  /**
   * Set user count
   */
  setUserCount(count) {
    this.userCount.set(count);
  }

  /**
   * Set workspace count
   */
  setWorkspaceCount(count) {
    this.workspaceCount.set(count);
  }

  /**
   * Record embedding creation
   */
  recordEmbedding(engine) {
    this.embeddings.labels(engine || "unknown").inc();
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics() {
    return await this.registry.metrics();
  }

  /**
   * Get metrics content type
   */
  getMetricsContentType() {
    return this.registry.contentType;
  }
}

module.exports = {
  MetricsCollector,
  getInstance: () => new MetricsCollector(),
};
