/**
 * Message Handler Registry
 * Central registry for all message type handlers, replacing the giant switch statement in agent.js
 */

import { MESSAGE_TYPES } from '../WebSocketConfig.js';
import { v4 } from 'uuid';
import { safeJsonParse } from '../../request.js';
import { emitAssistantMessageCompleteEvent } from '@/components/contexts/TTSProvider';
import { THREAD_RENAME_EVENT } from '@/components/Sidebar/ActiveWorkspaces/ThreadContainer';

/**
 * Handler interface:
 * - canHandle(type) => boolean
 * - handle(data, context) => void (async OK)
 *
 * Context object includes:
 * - setChatHistory: React state setter
 * - socket: WebSocket instance (if needed)
 * - emit: Function to emit events
 */

class MessageHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.initializeHandlers();
  }

  /**
   * Initialize all message handlers
   * @private
   */
  initializeHandlers() {
    // Register handler by type
    this.registerHandler(MESSAGE_TYPES.REPORT_STREAM_EVENT, handleReportStreamEvent);
    this.registerHandler(MESSAGE_TYPES.FILE_DOWNLOAD, handleFileDownloadCard);
    this.registerHandler(MESSAGE_TYPES.RECHART_VISUALIZE, handleRecharVisualize);
    this.registerHandler(MESSAGE_TYPES.TOOL_APPROVAL, handleToolApprovalRequest);
    this.registerHandler(MESSAGE_TYPES.CLARIFICATION, handleClarificationRequest);
    this.registerHandler(MESSAGE_TYPES.WSS_FAILURE, handleWSSFailure);
    this.registerHandler(MESSAGE_TYPES.RENAME_THREAD, handleRenameThread);
    this.registerHandler('*', handleDefaultMessage); // Wildcard for untyped messages
  }

  /**
   * Register a handler for a message type
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    if (!handler || typeof handler !== 'function') {
      throw new Error(`Invalid handler for type ${type}`);
    }
    this.handlers.set(type, handler);
  }

  /**
   * Get handler for a message type
   * @param {string} type - Message type
   * @returns {Function|null} Handler function or null
   */
  getHandler(type) {
    return this.handlers.get(type) || this.handlers.get('*');
  }

  /**
   * Handle a message by dispatching to appropriate handler
   * @param {object} data - Message data
   * @param {object} context - Handler context
   */
  async handle(data, context) {
    if (!data) return;

    // Handle special case: thread rename (no type field)
    if (data.hasOwnProperty('slug') && data.hasOwnProperty('name')) {
      return handleRenameThread(data, context);
    }

    const handler = this.getHandler(data.type);
    if (handler) {
      await handler(data, context);
    }
  }

  /**
   * Get all registered handler types
   * @returns {Array} Array of message types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys()).filter(type => type !== '*');
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      registeredTypes: this.getRegisteredTypes(),
      count: this.handlers.size - 1, // Exclude wildcard
    };
  }
}

/**
 * HANDLER IMPLEMENTATIONS
 */

/**
 * Handle reportStreamEvent - Complex streaming message type
 */
async function handleReportStreamEvent(data, context) {
  const { content, uuid } = data;
  if (!content) return;

  const { setChatHistory } = context;

  // Enable agent streaming for subsequent messages
  if (context.socket) {
    context.socket.supportsAgentStreaming = true;
  }

  // Trigger TTS auto-play if chat ID provided
  if (content.type === 'chatId' && content.chatId) {
    emitAssistantMessageCompleteEvent(content.chatId);
  }

  // Handle specific content types
  if (content.type === 'removeStatusResponse') {
    return setChatHistory(prev => prev.filter(msg => msg.uuid !== content.uuid));
  }

  if (content.type === 'modelRouteNotification') {
    if (!content.routedTo) return;
    return setChatHistory(prev => [
      ...prev.filter(msg => !(msg.role === 'assistant' && msg.pending && !msg.content)),
      {
        uuid: content.uuid,
        type: 'modelRouteNotification',
        content: 'modelRouteNotification',
        routedTo: content.routedTo,
      },
    ]);
  }

  // Find existing message or create new
  setChatHistory(prev => {
    const knownMessage = content.uuid ? prev.find(msg => msg.uuid === content.uuid) : null;

    if (!knownMessage) {
      // New message - initialize as appropriate type
      if (content.type === 'fullTextResponse') {
        return [
          ...prev.filter(msg => msg.content),
          {
            uuid: content.uuid,
            type: 'textResponse',
            content: content.content,
            role: 'assistant',
            sources: [],
            closed: true,
            error: null,
            animate: false,
            pending: false,
            metrics: {},
          },
        ];
      }

      // Initialize textResponseChunk as textResponse
      if (content.type === 'textResponseChunk') {
        if (content.content.trim() === '') return prev;
        return [
          ...prev.filter(msg => msg.content),
          {
            uuid: content.uuid,
            type: 'textResponse',
            content: content.content,
            role: 'assistant',
            sources: [],
            closed: true,
            error: null,
            animate: false,
            pending: false,
            metrics: {},
          },
        ];
      }

      // Default: create statusResponse
      return [
        ...prev.filter(msg => msg.content),
        {
          uuid: content.uuid,
          type: 'statusResponse',
          content: content.content,
          role: 'assistant',
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
          metrics: {},
        },
      ];
    }

    // Update existing message
    const { type, content: contentData, uuid: contentUuid } = content;

    // Handle tool call invocations - replace entire message
    if (type === 'toolCallInvocation') {
      return [
        ...prev.filter(msg => msg.uuid !== contentUuid),
        { ...knownMessage, content: contentData },
      ];
    }

    // Handle usage metrics
    if (type === 'usageMetrics' && contentData.metrics) {
      return prev.map(msg =>
        msg.uuid === contentUuid ? { ...msg, metrics: contentData.metrics } : msg
      );
    }

    // Handle citations
    if (type === 'citations' && contentData.citations) {
      return prev.map(msg =>
        msg.uuid === contentUuid
          ? { ...msg, sources: [...(msg.sources || []), ...contentData.citations] }
          : msg
      );
    }

    // Handle chat ID
    if (type === 'chatId' && contentData.chatId) {
      const assistantIdx = prev.findIndex(msg => msg.uuid === contentUuid);
      if (assistantIdx === -1) return prev;
      const userIdx = prev.findLastIndex((msg, i) => i < assistantIdx && msg.role === 'user');
      return prev.map((msg, i) =>
        i === assistantIdx || i === userIdx ? { ...msg, chatId: contentData.chatId } : msg
      );
    }

    // Handle text response chunks - append to content
    if (type === 'textResponseChunk') {
      return prev
        .map(msg =>
          msg.uuid === contentUuid
            ? { ...msg, type: 'textResponse', content: msg.content + contentData }
            : msg?.content
              ? msg
              : null
        )
        .filter(msg => msg);
    }

    // Generic text append
    return prev.map(msg =>
      msg.uuid === contentUuid
        ? { ...msg, content: msg.content + contentData }
        : msg
    );
  });
}

/**
 * Handle fileDownloadCard
 */
function handleFileDownloadCard(data, context) {
  const { content } = data;
  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      type: 'fileDownloadCard',
      uuid: v4(),
      content,
      role: 'assistant',
      sources: [],
      closed: true,
      error: null,
      animate: false,
      pending: false,
      metrics: data.metrics || {},
    },
  ]);
}

/**
 * Handle recharVisualize
 */
function handleRecharVisualize(data, context) {
  const { content } = data;
  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      type: 'rechartVisualize',
      uuid: v4(),
      content,
      role: 'assistant',
      sources: [],
      closed: true,
      error: null,
      animate: false,
      pending: false,
      metrics: data.metrics || {},
    },
  ]);
}

/**
 * Handle toolApprovalRequest
 */
function handleToolApprovalRequest(data, context) {
  if (!data.requestId || !data.skillName) return;

  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      uuid: v4(),
      type: 'toolApprovalRequest',
      requestId: data.requestId,
      skillName: data.skillName,
      payload: data.payload,
      description: data.description,
      timeoutMs: data.timeoutMs,
      content: `Approval requested for ${data.skillName}`,
      role: 'assistant',
      sources: [],
      closed: false,
      error: null,
      animate: false,
      pending: true,
      metrics: {},
    },
  ]);
}

/**
 * Handle clarificationRequest
 */
function handleClarificationRequest(data, context) {
  if (!data.requestId || !Array.isArray(data.questions)) return;

  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      uuid: v4(),
      type: 'clarifyingQuestion',
      requestId: data.requestId,
      questions: data.questions,
      allowSkip: data.allowSkip !== false,
      timeoutMs: data.timeoutMs,
      content: `Agent has ${data.questions.length} question${data.questions.length === 1 ? '' : 's'}`,
      role: 'assistant',
      sources: [],
      closed: false,
      error: null,
      animate: false,
      pending: true,
      metrics: {},
    },
  ]);
}

/**
 * Handle wssFailure
 */
function handleWSSFailure(data, context) {
  const { content } = data;
  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      uuid: v4(),
      content,
      role: 'assistant',
      sources: [],
      closed: true,
      error: content,
      animate: false,
      pending: false,
      metrics: {},
    },
  ]);
}

/**
 * Handle renameThread event
 */
function handleRenameThread(data, context) {
  const { slug, name } = data;
  if (!slug || !name) return;

  window.dispatchEvent(
    new CustomEvent(THREAD_RENAME_EVENT, {
      detail: { threadSlug: slug, newName: name },
    })
  );
}

/**
 * Default handler for untyped messages
 */
function handleDefaultMessage(data, context) {
  // Only handle messages without a type field
  if (data.type || !data.content) return;

  const { setChatHistory } = context;

  return setChatHistory(prev => [
    ...prev.filter(msg => msg.content),
    {
      uuid: v4(),
      content: data.content,
      role: 'assistant',
      sources: [],
      closed: true,
      error: null,
      animate: false,
      pending: false,
      metrics: {},
    },
  ]);
}

// Export singleton
export const messageHandlerRegistry = new MessageHandlerRegistry();

export default MessageHandlerRegistry;
