const fs = require("fs");
const path = require("path");

/**
 * Language Detector Service for Multi-Language RAG Support
 * Supports: French (fr), English (en), German (de), Spanish (es), Italian (it)
 * Uses franc-min library for lightweight, offline language detection
 */

// Try to load franc library (will be added to package.json)
let franc = null;
try {
  franc = require("franc-min");
} catch (error) {
  console.warn(
    "[LanguageDetector] franc-min not installed. Language detection disabled. Install with: npm install franc-min"
  );
}

// Supported languages for RAG
const SUPPORTED_LANGUAGES = ["en", "fr", "de", "es", "it"];

// Language display names
const LANGUAGE_NAMES = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
};

// Language ISO codes to franc codes mapping
const LANGUAGE_CODE_MAP = {
  en: "eng",
  fr: "fra",
  de: "deu",
  es: "spa",
  it: "ita",
};

// Reverse mapping for franc codes
const FRANC_CODE_TO_LANG = {
  eng: "en",
  fra: "fr",
  deu: "de",
  spa: "es",
  ita: "it",
};

// Cache for recently detected languages
const detectionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const LanguageDetector = {
  /**
   * Detect language from plain text
   * @param {string} text - The text to detect language from
   * @param {number} minConfidence - Minimum confidence threshold (0-1)
   * @returns {string} - Detected language code (en|fr|de|es|it) or 'en' as default
   */
  detectLanguage: function (text = "", minConfidence = 0.5) {
    if (!franc || !text || typeof text !== "string") {
      return "en"; // Default to English
    }

    try {
      const trimmedText = text.trim();
      if (trimmedText.length < 10) {
        return "en"; // Too short for accurate detection
      }

      // Use franc to detect language with full result set
      const detected = franc.all(trimmedText);

      if (!Array.isArray(detected) || detected.length === 0) {
        return "en";
      }

      // Get the top result
      const [francCode, confidence] = detected[0];

      // Check if confidence meets minimum threshold
      if (confidence < minConfidence) {
        return "en";
      }

      // Convert franc code to our standard codes
      const langCode = FRANC_CODE_TO_LANG[francCode];

      // Only return if it's a supported language
      if (langCode && SUPPORTED_LANGUAGES.includes(langCode)) {
        return langCode;
      }

      // If detected but not supported, return null for caller to handle
      return null;
    } catch (error) {
      console.error("[LanguageDetector.detectLanguage] Error:", error.message);
      return "en";
    }
  },

  /**
   * Detect language from a file
   * Reads the file, extracts sample text, and detects language
   * @param {string} docPath - Path to document file
   * @returns {Promise<string>} - Detected language code
   */
  detectLanguageFromFile: async function (docPath = null) {
    if (!docPath) return "en";

    try {
      // Check cache first
      const cacheKey = `lang:${docPath}`;
      const cached = detectionCache.get(cacheKey);
      if (cached && cached.timestamp > Date.now()) {
        return cached.language;
      }

      // Resolve file path
      const resolvedPath = path.resolve(docPath);

      // Verify file exists
      if (!fs.existsSync(resolvedPath)) {
        console.warn(
          `[LanguageDetector] File not found: ${resolvedPath}. Using default language.`
        );
        return "en";
      }

      // Get file extension to determine how to parse
      const ext = path.extname(resolvedPath).toLowerCase();

      let textContent = "";

      // For text files
      if ([".txt"].includes(ext)) {
        textContent = fs.readFileSync(resolvedPath, "utf-8");
      }

      // For markdown files
      if ([".md", ".markdown"].includes(ext)) {
        textContent = fs.readFileSync(resolvedPath, "utf-8");
      }

      // For JSON documents (metadata)
      if (ext === ".json") {
        try {
          const jsonData = JSON.parse(
            fs.readFileSync(resolvedPath, "utf-8")
          );
          // Extract text from common fields
          textContent = [
            jsonData.title,
            jsonData.content,
            jsonData.text,
            jsonData.body,
            jsonData.description,
          ]
            .filter(Boolean)
            .join(" ");
        } catch {
          return "en";
        }
      }

      // For other binary file types (PDF, DOCX, etc.), we'll rely on pre-extracted text
      // from the document processing pipeline via fileData()
      if (!textContent || textContent.length < 10) {
        // Fall back to trying to read as text anyway
        try {
          const raw = fs.readFileSync(resolvedPath, "utf-8", {
            flag: "r",
          });
          textContent = raw.substring(0, 5000); // First 5KB for detection
        } catch {
          return "en";
        }
      }

      // Detect from extracted text
      const detected =
        this.detectLanguage(textContent, 0.5) || "en";

      // Cache the result
      detectionCache.set(cacheKey, {
        language: detected,
        timestamp: Date.now() + CACHE_TTL,
      });

      return detected;
    } catch (error) {
      console.error(
        "[LanguageDetector.detectLanguageFromFile] Error:",
        error.message
      );
      return "en";
    }
  },

  /**
   * Detect language from document text data (used in embedding pipeline)
   * @param {Object} documentData - Document data from fileData() with pageContent
   * @returns {Promise<string>} - Detected language code
   */
  detectLanguageFromDocumentData: async function (documentData = {}) {
    if (!documentData) return "en";

    try {
      // Try to get text from various fields
      const textContent = documentData.pageContent
        || documentData.text
        || documentData.content
        || documentData.body
        || (documentData.title ? `${documentData.title} ` : "");

      return this.detectLanguage(textContent, 0.5) || "en";
    } catch (error) {
      console.error(
        "[LanguageDetector.detectLanguageFromDocumentData] Error:",
        error.message
      );
      return "en";
    }
  },

  /**
   * Get display name for language code
   * @param {string} code - Language code (en|fr|de|es|it)
   * @returns {string} - Display name
   */
  getLanguageName: function (code = "en") {
    return LANGUAGE_NAMES[code] || LANGUAGE_NAMES["en"];
  },

  /**
   * Get language emoji for display
   * @param {string} code - Language code
   * @returns {string} - Emoji
   */
  getLanguageEmoji: function (code = "en") {
    const emojis = {
      en: "🇬🇧",
      fr: "🇫🇷",
      de: "🇩🇪",
      es: "🇪🇸",
      it: "🇮🇹",
    };
    return emojis[code] || "🌐";
  },

  /**
   * Normalize language code to standard format
   * Handles common variations (eng→en, fra→fr, etc.)
   * @param {string} detected - Detected language code (any format)
   * @returns {string} - Normalized code (en|fr|de|es|it) or null if unsupported
   */
  normalizeLanguageCode: function (detected = "en") {
    if (!detected) return "en";

    const normalizedCode = detected.toLowerCase().trim();

    // Already normalized
    if (SUPPORTED_LANGUAGES.includes(normalizedCode)) {
      return normalizedCode;
    }

    // Convert 3-letter codes
    if (FRANC_CODE_TO_LANG[normalizedCode]) {
      return FRANC_CODE_TO_LANG[normalizedCode];
    }

    // Unknown format
    return "en";
  },

  /**
   * Get all supported languages
   * @returns {Array<string>} - Array of supported language codes
   */
  getSupportedLanguages: function () {
    return [...SUPPORTED_LANGUAGES];
  },

  /**
   * Get language configuration for frontend/UI
   * @returns {Array<Object>} - Language options with name, emoji, code
   */
  getLanguageOptions: function () {
    return SUPPORTED_LANGUAGES.map((code) => ({
      code,
      name: this.getLanguageName(code),
      emoji: this.getLanguageEmoji(code),
    }));
  },

  /**
   * Clear detection cache (useful for testing)
   */
  clearCache: function () {
    detectionCache.clear();
  },

  /**
   * Check if franc library is available
   * @returns {boolean}
   */
  isAvailable: function () {
    return franc !== null;
  },

  /**
   * Detect multiple languages in a batch of texts
   * Returns map of text hashes to detected languages
   * @param {Array<string>} texts - Array of text samples
   * @returns {Object} - Map of hash to language code
   */
  detectBatch: function (texts = []) {
    const results = {};
    for (let i = 0; i < texts.length; i++) {
      const hash = require("crypto")
        .createHash("md5")
        .update(texts[i])
        .digest("hex");
      results[hash] = this.detectLanguage(texts[i], 0.5) || "en";
    }
    return results;
  },
};

module.exports = { LanguageDetector };
