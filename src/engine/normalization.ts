/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ADDITIVES_DATABASE } from '../data/additivesDb';
import { CANONICAL_INGREDIENTS } from '../data/ingredientsDb';
import { Additive, AnalyzedIngredient, CanonicalIngredient, HalalStatus, PorkStatus, RiskLevel } from '../types/halal';

// Language detection keywords
const LANGUAGE_MARKERS: Record<string, string[]> = {
  fr: ['ingrédients', 'sucre', 'lait', 'huile', 'émulsifiant', 'arôme', 'sel', 'farine', 'gélatine', 'porc', 'matière'],
  de: ['zutaten', 'zucker', 'milch', 'öl', 'emulgator', 'aroma', 'salz', 'mehl', 'gelatine', 'schwein', 'pflanzlich'],
  es: ['ingredientes', 'azúcar', 'leche', 'aceite', 'emulsionante', 'aroma', 'sal', 'harina', 'gelatina', 'cerdo'],
  it: ['ingredienti', 'zucchero', 'latte', 'olio', 'emulsionante', 'aroma', 'sale', 'farina', 'gelatina', 'maiale'],
  nl: ['ingrediënten', 'suiker', 'melk', 'olie', 'emulgator', 'aroma', 'zout', 'bloem', 'gelatine', 'varken'],
  pl: ['składniki', 'cukier', 'mleko', 'olej', 'emulgator', 'aromat', 'sól', 'mąka', 'żelatyna', 'wieprzowina'],
  tr: ['içindekiler', 'şeker', 'süt', 'yağ', 'emülgatör', 'aroma', 'tuz', 'un', 'jelatin', 'domuz'],
  ar: ['المكونات', 'سكر', 'حليب', 'زيت', 'مستحلب', 'نكهة', 'ملح', 'دقيق', 'جيلاتين', 'خنزير'],
  en: ['ingredients', 'sugar', 'milk', 'oil', 'emulsifier', 'flavouring', 'salt', 'flour', 'gelatin', 'pork'],
};

export function detectLanguage(text: string): { language: string; confidence: number } {
  const lower = text.toLowerCase();
  let bestLang = 'en';
  let maxMatches = 0;

  for (const [lang, markers] of Object.entries(LANGUAGE_MARKERS)) {
    let count = 0;
    for (const marker of markers) {
      if (lower.includes(marker.toLowerCase())) {
        count++;
      }
    }
    if (count > maxMatches) {
      maxMatches = count;
      bestLang = lang;
    }
  }

  const confidence = Math.min(100, Math.max(50, maxMatches * 20));
  return { language: bestLang, confidence };
}

// Clean and tokenize ingredient text into segmented strings
export function segmentIngredients(text: string): string[] {
  // 1. Remove introductory headers like "Ingredients:", "Zutaten:", "Ingrédients :"
  let cleaned = text.replace(/^(ingr[ée]dients?|zutaten|sk[łl]adniki|i[çc]indekiler|المكونات|ingredienti)\s*[:\-–]\s*/i, '');

  // 2. Normalize whitespace and strange linebreaks
  cleaned = cleaned.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 3. Handle parentheses: protect commas inside parentheses, e.g. "chocolate 13% (sugar, cocoa, vanilla)"
  const segments: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(' || char === '[') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if ((char === ',' || char === ';' || char === '•' || char === '·') && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        segments.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const lastTrimmed = current.trim();
  if (lastTrimmed.length > 0) {
    segments.push(lastTrimmed);
  }

  return segments;
}

// Normalizes single ingredient string: strip percentages, punctuation, lowercase
export function normalizeIngredientString(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s*%/g, '') // remove "40%", "8.7%"
    .replace(/[.:;*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract E-number (e.g. E471, E-471, E 471, INS 471)
export function extractENumber(text: string): string | null {
  const match = text.match(/\b(e\s*[-–]?\s*(\d{3,4}[a-z]?))\b/i);
  if (match) {
    return 'E' + match[2].toUpperCase().replace(/\s+/g, '');
  }
  const insMatch = text.match(/\bins\s*[-–]?\s*(\d{3,4}[a-z]?)\b/i);
  if (insMatch) {
    return 'E' + insMatch[1].toUpperCase().replace(/\s+/g, '');
  }
  return null;
}

// CONTEXTUAL MATCHING ENGINE (Section 10)
export function matchSingleIngredient(rawText: string, detectedLang = 'en'): AnalyzedIngredient {
  const normalized = normalizeIngredientString(rawText);
  const foundENumber = extractENumber(rawText);

  // Check E-number database first if present
  let matchedAdditive: Additive | undefined;
  if (foundENumber) {
    matchedAdditive = ADDITIVES_DATABASE.find(
      (a) => a.eNumber.toLowerCase() === foundENumber.toLowerCase()
    );
  }

  // --- RULE 1: CONTEXTUAL OVERRIDES ---

  // Context: "Pork Gelatin" / "Gélatine de porc" / "Schweinegelatine"
  if (
    /pork\s+gelatin/i.test(normalized) ||
    /porcine\s+gelatin/i.test(normalized) ||
    /g[ée]latine\s+(de\s+)?porc/i.test(normalized) ||
    /g[ée]latine\s+porcine/i.test(normalized) ||
    /schweinegelatine/i.test(normalized) ||
    /gelatina\s+(de\s+)?cerdo/i.test(normalized) ||
    /gelatina\s+suina/i.test(normalized) ||
    /żelatyna\s+wieprzowa/i.test(normalized) ||
    /domuz\s+jelatini/i.test(normalized) ||
    /جيلاتين\s+خنزير/i.test(normalized)
  ) {
    const canonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_PORK_GELATIN');
    return {
      rawText,
      normalizedText: normalized,
      matchedIngredient: canonical,
      halalStatus: 'PORK_DERIVED',
      porkStatus: 'PORK_DETECTED',
      riskLevel: 'CRITICAL',
      flagged: true,
      needsSourceVerification: false,
      reason: 'Explicit porcine (pork) gelatin declared on packaging. Strictly prohibited in Halal dietary practice.',
      overrideContext: 'Explicit pork origin stated',
      detectedLanguage: detectedLang,
    };
  }

  // Context: "Fish Gelatin" / "Halal Beef Gelatin"
  if (
    /fish\s+gelatin/i.test(normalized) ||
    /marine\s+gelatin/i.test(normalized) ||
    /g[ée]latine\s+de\s+poisson/i.test(normalized) ||
    /fischgelatine/i.test(normalized)
  ) {
    const canonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_FISH_GELATIN');
    return {
      rawText,
      normalizedText: normalized,
      matchedIngredient: canonical,
      halalStatus: 'HALAL',
      porkStatus: 'NO_PORK_DETECTED',
      riskLevel: 'NONE',
      flagged: false,
      needsSourceVerification: false,
      reason: 'Fish / marine gelatin is permissible (Halal) without animal slaughter ambiguity.',
      overrideContext: 'Marine/Fish source declared',
      detectedLanguage: detectedLang,
    };
  }

  if (
    /halal\s+(beef|bovine)\s+gelatin/i.test(normalized) ||
    /g[ée]latine\s+bovine\s+halal/i.test(normalized) ||
    /helal\s+s[ıi][gğ][ıi]r\s+jelatini/i.test(normalized)
  ) {
    const canonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_BEEF_GELATIN_HALAL');
    return {
      rawText,
      normalizedText: normalized,
      matchedIngredient: canonical,
      halalStatus: 'HALAL',
      porkStatus: 'NO_PORK_DETECTED',
      riskLevel: 'NONE',
      flagged: false,
      needsSourceVerification: false,
      reason: 'Certified Halal beef gelatin with documented slaughter compliance.',
      overrideContext: 'Certified Halal beef source',
      detectedLanguage: detectedLang,
    };
  }

  // Context: "Vegetable mono- and diglycerides" vs generic E471
  if (
    /vegetable\s+mono/i.test(normalized) ||
    /mono.*origine\s+v[ée]g[ée]tale/i.test(normalized) ||
    /pflanzliche\s+mono/i.test(normalized) ||
    /plantaardige\s+mono/i.test(normalized) ||
    /mono.*origen\s+vegetal/i.test(normalized) ||
    /mono.*origine\s+vegetale/i.test(normalized) ||
    /bitkisel\s+mono/i.test(normalized)
  ) {
    const canonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_E471_VEGETABLE');
    return {
      rawText,
      normalizedText: normalized,
      matchedIngredient: canonical,
      matchedAdditive,
      halalStatus: 'PLANT_BASED',
      porkStatus: 'NO_PORK_DETECTED',
      riskLevel: 'NONE',
      flagged: false,
      needsSourceVerification: false,
      reason: 'Label explicitly declares 100% plant / vegetable fatty acid origin for mono- and diglycerides.',
      overrideContext: 'Plant origin confirmed on label',
      detectedLanguage: detectedLang,
    };
  }

  // Context: "Microbial rennet" / "Vegetarian rennet"
  if (
    /microbial\s+rennet/i.test(normalized) ||
    /pr[ée]sure\s+microbienne/i.test(normalized) ||
    /mikrobielles\s+lab/i.test(normalized) ||
    /cuajo\s+microbiano/i.test(normalized) ||
    /caglio\s+microbico/i.test(normalized) ||
    /vegetarian\s+rennet/i.test(normalized) ||
    /mikrobiyal\s+maya/i.test(normalized)
  ) {
    const canonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_MICROBIAL_RENNET');
    return {
      rawText,
      normalizedText: normalized,
      matchedIngredient: canonical,
      halalStatus: 'HALAL',
      porkStatus: 'NO_PORK_DETECTED',
      riskLevel: 'NONE',
      flagged: false,
      needsSourceVerification: false,
      reason: 'Microbially fermented coagulant. No animal stomach extraction involved.',
      overrideContext: 'Microbial/Vegetarian source declared',
      detectedLanguage: detectedLang,
    };
  }

  // Check explicit pork terms in any language
  const porkCanonical = CANONICAL_INGREDIENTS.find((c) => c.id === 'ING_PORK' || c.id === 'ING_LARD');
  if (porkCanonical) {
    for (const [lang, aliases] of Object.entries(porkCanonical.aliases)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(normalized)) {
          return {
            rawText,
            normalizedText: normalized,
            matchedIngredient: porkCanonical,
            halalStatus: 'PORK_DERIVED',
            porkStatus: 'PORK_DETECTED',
            riskLevel: 'CRITICAL',
            flagged: true,
            needsSourceVerification: false,
            reason: `Declared pork ingredient detected: "${alias}". Prohibited in Islamic law.`,
            overrideContext: `Pork match (${lang.toUpperCase()})`,
            detectedLanguage: detectedLang,
          };
        }
      }
    }
  }

  // Match canonical ingredients
  for (const item of CANONICAL_INGREDIENTS) {
    for (const [, aliases] of Object.entries(item.aliases)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias.replace(/[()]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalized)) {
          return {
            rawText,
            normalizedText: normalized,
            matchedIngredient: item,
            matchedAdditive,
            halalStatus: item.halalStatus,
            porkStatus: item.porkStatus,
            riskLevel: item.riskLevel,
            flagged: item.halalStatus === 'NOT_HALAL' || item.halalStatus === 'PORK_DERIVED' || item.halalStatus === 'MASHBOOH',
            needsSourceVerification: item.verificationRequired,
            reason: item.reason,
            detectedLanguage: detectedLang,
          };
        }
      }
    }
  }

  // Match additive from E-number database if found
  if (matchedAdditive) {
    return {
      rawText,
      normalizedText: normalized,
      matchedAdditive,
      halalStatus: matchedAdditive.halalStatus,
      porkStatus: matchedAdditive.porkStatus,
      riskLevel: matchedAdditive.riskLevel,
      flagged: matchedAdditive.halalStatus === 'NOT_HALAL' || matchedAdditive.halalStatus === 'PORK_DERIVED' || matchedAdditive.halalStatus === 'MASHBOOH',
      needsSourceVerification: matchedAdditive.verificationRequired,
      reason: matchedAdditive.reason,
      detectedLanguage: detectedLang,
    };
  }

  // Default clean baseline (e.g. water, flour, cocoa, salt, starch, spices)
  return {
    rawText,
    normalizedText: normalized,
    halalStatus: 'HALAL',
    porkStatus: 'NO_PORK_DETECTED',
    riskLevel: 'NONE',
    flagged: false,
    needsSourceVerification: false,
    reason: 'Standard food ingredient with no identified animal or pork risk factors.',
    detectedLanguage: detectedLang,
  };
}
