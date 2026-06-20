/**
 * Knowledge Graph Builder - Extracts concepts and builds relationships from documents
 * Uses NER (Named Entity Recognition) and semantic analysis
 */

const { KnowledgeGraph } = require("../../models/knowledgeGraph");
const { Document } = require("../../models/documents");

const GraphBuilder = {
  // Common entity patterns for basic NER
  ENTITY_PATTERNS: {
    person: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)/g, // Names like "John Smith"
    organization: /\b(Inc\.|LLC|Corp\.|Corporation|Company|Ltd\.|University|Institute|Department)\b/gi,
    location: /\b(United States|England|France|Germany|China|Japan|India|Canada|Australia|New Zealand|Berlin|London|Paris|Tokyo|Sydney)\b/gi,
    date: /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    url: /https?:\/\/[^\s]+/g,
  },

  /**
   * Extract concepts from document text using simple patterns
   * @param {string} text - Document text
   * @param {string} docId - Document ID
   * @returns {Array<{type: string, value: string, confidence: number}>}
   */
  extractConcepts: function (text, docId) {
    const concepts = [];
    const seenConcepts = new Set();

    if (!text || typeof text !== "string") return concepts;

    // Extract basic entities
    for (const [type, pattern] of Object.entries(this.ENTITY_PATTERNS)) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(text)) !== null) {
        const concept = match[0].trim();
        if (concept.length > 2 && !seenConcepts.has(concept.toLowerCase())) {
          concepts.push({
            type,
            value: concept,
            confidence: 0.6,
          });
          seenConcepts.add(concept.toLowerCase());
        }
      }
    }

    // Extract key noun phrases (simple heuristic)
    const nounPhrases = this._extractNounPhrases(text);
    for (const phrase of nounPhrases) {
      if (!seenConcepts.has(phrase.toLowerCase())) {
        concepts.push({
          type: "topic",
          value: phrase,
          confidence: 0.5,
        });
        seenConcepts.add(phrase.toLowerCase());
      }
    }

    return concepts.slice(0, 50); // Limit to 50 concepts per document
  },

  /**
   * Simple noun phrase extraction (capitalized words and common technical terms)
   * @param {string} text
   * @returns {Array<string>}
   */
  _extractNounPhrases: function (text) {
    const phrases = [];
    const words = text.split(/[\s.,!?;:\-()[\]{}]/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Look for capitalized words (potential proper nouns)
      if (word.length > 3 && /^[A-Z][a-z]+$/.test(word)) {
        // Check for multi-word phrases
        if (i + 1 < words.length && /^[A-Z][a-z]+$/.test(words[i + 1])) {
          phrases.push(`${word} ${words[i + 1]}`);
        } else {
          phrases.push(word);
        }
      }
    }

    return [...new Set(phrases)]; // Remove duplicates
  },

  /**
   * Find connections between documents based on shared concepts
   * @param {number} workspaceId
   * @param {string} docId - Document to analyze
   * @param {Array<string>} concepts - Document concepts
   * @returns {Promise<Array<{docId: string, conceptMatches: number}>>}
   */
  findConceptConnections: async function (workspaceId, docId, concepts) {
    try {
      const allDocs = await Document.forWorkspace(workspaceId);
      const connections = [];
      const docConcepts = concepts.map((c) => c.value.toLowerCase());

      // Note: In a real implementation, you'd fetch document content from storage
      // For now, we'll build connections based on metadata and existing concepts
      for (const doc of allDocs) {
        if (doc.docId === docId) continue;

        // Simple heuristic: similar filenames suggest related documents
        const similarName = this._calculateStringSimilarity(
          docId.toLowerCase(),
          doc.docId.toLowerCase()
        );

        if (similarName > 0.5) {
          connections.push({
            docId: doc.docId,
            strength: Math.round(similarName * 100),
            reason: "Similar filename",
          });
        }
      }

      return connections;
    } catch (error) {
      console.error(`Failed to find concept connections:`, error);
      return [];
    }
  },

  /**
   * Simple string similarity calculation (Levenshtein-inspired)
   * @param {string} str1
   * @param {string} str2
   * @returns {number} 0-1 similarity score
   */
  _calculateStringSimilarity: function (str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} s1
   * @param {string} s2
   * @returns {number}
   */
  _levenshteinDistance: function (s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  },

  /**
   * Build graph nodes and edges for a document
   * @param {number} workspaceId
   * @param {string} docId
   * @param {string} filename
   * @param {string} documentText - Optional document content
   * @returns {Promise<{success: boolean, nodesCreated: number, edgesCreated: number}>}
   */
  buildGraphForDocument: async function (
    workspaceId,
    docId,
    filename,
    documentText = ""
  ) {
    let nodesCreated = 0;
    let edgesCreated = 0;

    try {
      // Create document node
      const docNodeResult = await KnowledgeGraph.createNode(
        workspaceId,
        "document",
        filename,
        docId,
        `Document: ${filename}`
      );

      if (!docNodeResult.success) {
        return {
          success: false,
          error: "Failed to create document node",
          nodesCreated,
          edgesCreated,
        };
      }

      const documentNode = docNodeResult.node;
      nodesCreated++;

      // Extract concepts from document text if provided
      if (documentText && documentText.length > 0) {
        const concepts = this.extractConcepts(documentText, docId);

        // Create concept nodes and link to document
        for (const concept of concepts) {
          // Check if concept node already exists
          const existingNodes = await KnowledgeGraph.searchNodes(
            workspaceId,
            concept.value
          );
          let conceptNode = existingNodes.find(
            (n) => n.nodeType === "concept" && n.label === concept.value
          );

          if (!conceptNode) {
            const conceptResult = await KnowledgeGraph.createNode(
              workspaceId,
              "concept",
              concept.value,
              null,
              `Concept extracted from documents`
            );
            if (conceptResult.success) {
              conceptNode = conceptResult.node;
              nodesCreated++;
            }
          }

          // Create edge from document to concept
          if (conceptNode) {
            const edgeResult = await KnowledgeGraph.createEdge(
              workspaceId,
              documentNode.id,
              conceptNode.id,
              "mentions",
              concept.confidence * 100,
              concept.confidence
            );
            if (edgeResult.isNew) {
              edgesCreated++;
            }
          }
        }
      }

      // Find and create connections to other documents
      const connections = await this.findConceptConnections(
        workspaceId,
        docId,
        []
      );

      for (const connection of connections) {
        // Get or create node for connected document
        const otherDocNodes = await KnowledgeGraph.getDocumentNodes(
          workspaceId,
          connection.docId
        );
        let otherDocNode = otherDocNodes.find(
          (n) => n.nodeType === "document"
        );

        if (otherDocNode) {
          const edgeResult = await KnowledgeGraph.createEdge(
            workspaceId,
            documentNode.id,
            otherDocNode.id,
            "related",
            connection.strength,
            connection.strength / 100
          );
          if (edgeResult.isNew) {
            edgesCreated++;
          }
        }
      }

      return {
        success: true,
        nodesCreated,
        edgesCreated,
      };
    } catch (error) {
      console.error(`Failed to build graph for document:`, error);
      return {
        success: false,
        error: error.message,
        nodesCreated,
        edgesCreated,
      };
    }
  },

  /**
   * Rebuild entire knowledge graph for a workspace
   * @param {number} workspaceId
   * @returns {Promise<{success: boolean, stats: object}>}
   */
  rebuildWorkspaceGraph: async function (workspaceId) {
    try {
      // Clear existing graph
      await KnowledgeGraph.clearWorkspaceGraph(workspaceId);

      // Get all documents in workspace
      const documents = await Document.forWorkspace(workspaceId);

      let totalNodesCreated = 0;
      let totalEdgesCreated = 0;

      for (const doc of documents) {
        const result = await this.buildGraphForDocument(
          workspaceId,
          doc.docId,
          doc.filename
        );
        if (result.success) {
          totalNodesCreated += result.nodesCreated;
          totalEdgesCreated += result.edgesCreated;
        }
      }

      // Get final statistics
      const stats = await KnowledgeGraph.getGraphStatistics(workspaceId);

      return {
        success: true,
        documentsProcessed: documents.length,
        nodesCreated: totalNodesCreated,
        edgesCreated: totalEdgesCreated,
        finalStats: stats,
      };
    } catch (error) {
      console.error(`Failed to rebuild workspace graph:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

module.exports = { GraphBuilder };
