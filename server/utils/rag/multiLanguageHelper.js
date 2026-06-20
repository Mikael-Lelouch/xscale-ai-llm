const { LanguageDetector } = require("./languageDetector");

/**
 * Multi-Language RAG Helper Functions
 * Handles language detection, response language selection, and cross-language search
 */

const MultiLanguageHelper = {
  /**
   * Detect the language of a user's query
   * @param {string} message - User message
   * @param {number} minConfidence - Minimum confidence threshold
   * @returns {string} - Detected language code (en|fr|de|es|it)
   */
  detectQueryLanguage: function (message = "") {
    if (!message || typeof message !== "string") {
      return "en";
    }
    return LanguageDetector.detectLanguage(message, 0.5) || "en";
  },

  /**
   * Determine the appropriate response language based on various factors
   * Strategy: workspace preference > majority of source languages > query language > default
   * @param {Object} workspace - Workspace object with language preferences
   * @param {string} queryLanguage - Detected language from user query
   * @param {Array<string>} sourceLanguages - Languages of retrieved documents
   * @returns {string} - Response language code
   */
  determineResponseLanguage: function ({
    workspace = null,
    queryLanguage = "en",
    sourceLanguages = [],
  }) {
    // Strategy 1: Use workspace preferred response language if set and not 'default'
    if (
      workspace?.preferredResponseLanguage &&
      workspace.preferredResponseLanguage !== "default"
    ) {
      return workspace.preferredResponseLanguage;
    }

    // Strategy 2: Use majority language from retrieved sources
    if (sourceLanguages && sourceLanguages.length > 0) {
      const langCounts = {};
      sourceLanguages.forEach((lang) => {
        if (lang) {
          langCounts[lang] = (langCounts[lang] || 0) + 1;
        }
      });

      const majorityLang = Object.keys(langCounts).sort(
        (a, b) => langCounts[b] - langCounts[a]
      )[0];

      if (majorityLang) {
        return majorityLang;
      }
    }

    // Strategy 3: Use query language if detected
    if (queryLanguage && LanguageDetector.getSupportedLanguages().includes(queryLanguage)) {
      return queryLanguage;
    }

    // Strategy 4: Default to English
    return "en";
  },

  /**
   * Extract language metadata from search result documents
   * @param {Array<Object>} sources - Search result sources
   * @returns {Array<string>} - Array of language codes
   */
  extractSourceLanguages: function (sources = []) {
    if (!Array.isArray(sources)) {
      return [];
    }

    return sources
      .map((src) => src?.detectedLanguage || src?.language || "en")
      .filter(Boolean);
  },

  /**
   * Get language instruction string for system prompt
   * @param {string} responseLanguage - Target response language code
   * @returns {string} - Instruction text to append to system prompt
   */
  getLanguageInstruction: function (responseLanguage = "en") {
    if (!responseLanguage || responseLanguage === "en") {
      return "";
    }

    const languageNames = {
      fr: "French",
      de: "German",
      es: "Spanish",
      it: "Italian",
      en: "English",
    };

    const langName = languageNames[responseLanguage] || responseLanguage;
    const langCode = responseLanguage.toUpperCase();

    return `\n\nIMPORTANT: Respond in ${langName} (${langCode}). All of your response must be in ${langName}, including any code examples, explanations, and responses.`;
  },

  /**
   * Filter documents by language
   * @param {Array<Object>} sources - Source documents
   * @param {Array<string>} allowedLanguages - Allowed language codes
   * @returns {Array<Object>} - Filtered sources
   */
  filterSourcesByLanguage: function (sources = [], allowedLanguages = null) {
    if (!Array.isArray(sources) || !allowedLanguages) {
      return sources;
    }

    if (!Array.isArray(allowedLanguages) || allowedLanguages.length === 0) {
      return sources;
    }

    return sources.filter((src) => {
      const srcLang = src?.detectedLanguage || src?.language || "en";
      return allowedLanguages.includes(srcLang);
    });
  },

  /**
   * Get workspace supported languages
   * @param {Object} workspace - Workspace object
   * @returns {Array<string>} - Array of supported language codes
   */
  getWorkspaceSupportedLanguages: function (workspace = null) {
    if (!workspace?.supportedLanguages) {
      return ["en"];
    }

    try {
      if (typeof workspace.supportedLanguages === "string") {
        return JSON.parse(workspace.supportedLanguages);
      }
      if (Array.isArray(workspace.supportedLanguages)) {
        return workspace.supportedLanguages;
      }
    } catch (error) {
      console.error(
        "[MultiLanguageHelper] Failed to parse supportedLanguages:",
        error.message
      );
    }

    return ["en"];
  },

  /**
   * Detect and update workspace supported languages based on documents
   * @param {number} workspaceId - Workspace ID
   * @returns {Promise<Array<string>>} - Updated list of supported languages
   */
  detectWorkspaceSupportedLanguages: async function (workspaceId = null) {
    if (!workspaceId) return ["en"];

    try {
      const prisma = require("../prisma");
      const documents = await prisma.workspace_documents.findMany({
        where: { workspaceId },
        select: { detectedLanguage: true },
        distinct: ["detectedLanguage"],
      });

      const languages = documents
        .map((doc) => doc.detectedLanguage || "en")
        .filter((lang, idx, arr) => arr.indexOf(lang) === idx) // Unique
        .sort();

      return languages.length > 0 ? languages : ["en"];
    } catch (error) {
      console.error(
        "[MultiLanguageHelper] Failed to detect workspace languages:",
        error.message
      );
      return ["en"];
    }
  },

  /**
   * Format language badge for display (emoji + code)
   * @param {string} languageCode - Language code (en|fr|de|es|it)
   * @returns {Object} - Badge object with emoji, code, name
   */
  getLanguageBadge: function (languageCode = "en") {
    const normalizedCode = LanguageDetector.normalizeLanguageCode(languageCode);
    return {
      code: normalizedCode,
      emoji: LanguageDetector.getLanguageEmoji(normalizedCode),
      name: LanguageDetector.getLanguageName(normalizedCode),
      display: `${LanguageDetector.getLanguageEmoji(normalizedCode)} ${normalizedCode.toUpperCase()}`,
    };
  },

  /**
   * Get all language options for UI dropdowns/selectors
   * @returns {Array<Object>} - Language options
   */
  getLanguageOptions: function () {
    return LanguageDetector.getLanguageOptions();
  },

  /**
   * Check if cross-language search should be enabled
   * @param {Object} workspace - Workspace object
   * @returns {boolean} - Whether cross-language search is enabled
   */
  isCrossLanguageSearchEnabled: function (workspace = null) {
    if (!workspace) return true;
    return workspace?.enableCrossLanguageSearch !== false;
  },

  /**
   * Get language statistics for a workspace
   * @param {number} workspaceId - Workspace ID
   * @returns {Promise<Object>} - Language statistics
   */
  getWorkspaceLanguageStats: async function (workspaceId = null) {
    if (!workspaceId) return {};

    try {
      const prisma = require("../prisma");
      const stats = await prisma.workspace_documents.groupBy({
        by: ["detectedLanguage"],
        where: { workspaceId },
        _count: true,
      });

      const result = {};
      stats.forEach((stat) => {
        const lang = stat.detectedLanguage || "en";
        result[lang] = stat._count;
      });

      return result;
    } catch (error) {
      console.error(
        "[MultiLanguageHelper] Failed to get language stats:",
        error.message
      );
      return {};
    }
  },
};

module.exports = { MultiLanguageHelper };
