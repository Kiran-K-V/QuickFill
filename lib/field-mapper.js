// lib/field-mapper.js
// Maps user profile data and NLP results to form fields on web pages.

class FieldMapper {
  constructor(fields) {
    this.fields = fields || [];
  }

  // Main mapping function: matches extracted entities to form fields
  mapEntitiesToFields(entities) {
    const results = [];
    for (const entity of entities) {
      const candidates = this.fields.map(field => {
        const score = this.computeSimilarity(entity, field);
        return {
          field,
          score,
          confidence: this.computeConfidence(entity, field, score)
        };
      });
      // Sort candidates by score descending
      candidates.sort((a, b) => b.score - a.score);
      // Prioritize exact matches
      const best = candidates[0];
      results.push({
        entity,
        bestMatch: best,
        alternatives: candidates.slice(1, 3) // Top 2 alternatives
      });
    }
    return results;
  }

  // Compute similarity between entity and field (semantic + fuzzy)
  computeSimilarity(entity, field) {
    // Semantic type match (e.g., entity.type === field.classification)
    let semanticScore = entity.type === field.classification ? 1.0 : 0.5;
    // Fuzzy string match on name, id, label
    const entityLabel = (entity.type + ' ' + (entity.value || '')).toLowerCase();
    const fieldStrings = [field.name, field.id, field.label, field.type].map(s => (s || '').toLowerCase());
    let maxFuzzy = 0;
    for (const str of fieldStrings) {
      if (!str) continue;
      // Exact match
      if (str === entity.type) maxFuzzy = Math.max(maxFuzzy, 1.0);
      // Partial match
      if (str.includes(entity.type)) maxFuzzy = Math.max(maxFuzzy, 0.8);
      // Fuzzy match
      const lev = this.levenshtein(str, entity.type);
      const sim = 1 - lev / Math.max(str.length, entity.type.length, 1);
      maxFuzzy = Math.max(maxFuzzy, sim * 0.7);
      // Semantic label similarity
      const labelSim = this.semanticSimilarity(str, entityLabel);
      maxFuzzy = Math.max(maxFuzzy, labelSim * 0.9);
    }
    // Contextual boost: if field is near text node matching entity type
    let contextBoost = 0;
    if (field.element) {
      const contextText = this.getNearbyText(field.element).toLowerCase();
      if (contextText.includes(entity.type)) contextBoost = 0.1;
    }
    // Final score
    return Math.min(1, semanticScore * 0.6 + maxFuzzy * 0.3 + contextBoost);
  }

  // Compute confidence for a mapping
  computeConfidence(entity, field, score) {
    // Boost for exact type and label match
    let confidence = score;
    if (entity.type === field.classification && field.label && field.label.toLowerCase().includes(entity.type)) {
      confidence += 0.1;
    }
    return Math.min(1, confidence);
  }

  // Levenshtein distance for fuzzy matching
  levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Semantic similarity (very basic: shared words)
  semanticSimilarity(a, b) {
    const aWords = new Set(a.split(/\W+/));
    const bWords = new Set(b.split(/\W+/));
    const shared = [...aWords].filter(w => bWords.has(w));
    return shared.length / Math.max(aWords.size, bWords.size, 1);
  }

  // Get nearby text context for a field
  getNearbyText(element) {
    let text = '';
    // Previous sibling text
    if (element.previousSibling && element.previousSibling.nodeType === Node.TEXT_NODE) {
      text += element.previousSibling.textContent + ' ';
    }
    // Parent label
    if (element.parentElement && element.parentElement.tagName.toLowerCase() === 'label') {
      text += element.parentElement.innerText + ' ';
    }
    // Closest label[for]
    if (element.id) {
      const label = document.querySelector(`label[for='${element.id}']`);
      if (label) text += label.innerText + ' ';
    }
    // Aria-label
    if (element.hasAttribute && element.hasAttribute('aria-label')) {
      text += element.getAttribute('aria-label') + ' ';
    }
    // Placeholder
    if (element.hasAttribute && element.hasAttribute('placeholder')) {
      text += element.getAttribute('placeholder') + ' ';
    }
    return text.trim();
  }
}

// Export for use in other scripts
window.FieldMapper = FieldMapper; 