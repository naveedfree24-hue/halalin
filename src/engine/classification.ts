/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisResult, AnalyzedIngredient, ConfidenceLevel, HalalStatus, PorkStatus, Product } from '../types/halal';
import { detectLanguage, matchSingleIngredient, segmentIngredients } from './normalization';

export function runHalalAnalysis(
  ingredientText: string,
  product?: Product,
  ocrConfidence = 95
): AnalysisResult {
  const { language, confidence: langConfidence } = detectLanguage(ingredientText);
  const segments = segmentIngredients(ingredientText);
  const analyzedIngredients: AnalyzedIngredient[] = segments.map((seg) =>
    matchSingleIngredient(seg, language)
  );

  // 1. PORK STATUS ENGINE
  let porkStatus: PorkStatus = 'NO_PORK_DETECTED';
  let explicitPorkFound = false;
  let possiblePorkFound = false;
  const flaggedPorkIngredients: string[] = [];

  for (const ing of analyzedIngredients) {
    if (ing.porkStatus === 'PORK_DETECTED') {
      porkStatus = 'PORK_DETECTED';
      explicitPorkFound = true;
      flaggedPorkIngredients.push(ing.rawText);
    } else if (ing.porkStatus === 'POSSIBLE_PORK_SOURCE' && !explicitPorkFound) {
      porkStatus = 'POSSIBLE_PORK_SOURCE';
      possiblePorkFound = true;
      flaggedPorkIngredients.push(ing.rawText);
    }
  }

  let porkExplanation = 'No declared pork or porcine ingredients identified from the packaging label.';
  if (explicitPorkFound) {
    porkExplanation = `EXPLICIT PORK INGREDIENT DETECTED: ${flaggedPorkIngredients.join(', ')}. The packaging declares ingredients derived directly from swine/pork.`;
  } else if (possiblePorkFound) {
    porkExplanation = `Possible animal-derived source: pork cannot be excluded from the label alone for (${flaggedPorkIngredients.join(', ')}). Sourcing verification required.`;
  }

  // 2. HALAL INGREDIENT STATUS ENGINE
  let overallHalalStatus: HalalStatus = 'HALAL';
  let prohibitedCount = 0;
  let verifyCount = 0;
  let noConcernCount = 0;

  for (const ing of analyzedIngredients) {
    if (ing.halalStatus === 'PORK_DERIVED' || ing.halalStatus === 'NOT_HALAL') {
      prohibitedCount++;
    } else if (ing.halalStatus === 'SOURCE_DEPENDENT' || ing.halalStatus === 'MASHBOOH') {
      verifyCount++;
    } else {
      noConcernCount++;
    }
  }

  if (explicitPorkFound) {
    overallHalalStatus = 'PORK_DERIVED';
  } else if (prohibitedCount > 0) {
    overallHalalStatus = 'NOT_HALAL';
  } else if (verifyCount > 0) {
    overallHalalStatus = 'SOURCE_DEPENDENT';
  } else {
    overallHalalStatus = 'PLANT_BASED';
  }

  let summary = 'Ingredients appear compatible with Halal dietary guidelines.';
  let recommendation = 'No explicitly prohibited ingredients identified from available packaging.';

  if (overallHalalStatus === 'PORK_DERIVED') {
    summary = 'Prohibited pork derivative detected on ingredient panel.';
    recommendation = 'Avoid consumption. Explicit pork source identified.';
  } else if (overallHalalStatus === 'NOT_HALAL') {
    summary = 'Non-halal or prohibited ingredient identified (e.g. carmine/alcohol).';
    recommendation = 'Avoid consumption according to standard Halal dietary guidelines.';
  } else if (overallHalalStatus === 'SOURCE_DEPENDENT') {
    summary = `${verifyCount} ingredient(s) require origin verification (plant vs animal fats).`;
    recommendation = 'Check for recognized Halal certification mark or inquire with the manufacturer.';
  }

  // 3. CERTIFICATION EVALUATION
  let certStatus = product?.certifications?.[0]?.status || 'NOT_VERIFIED';
  let certifierName = product?.certifications?.[0]?.certifierName;
  let certDetails = 'No official halal certification documented for this market packaging.';

  if (certStatus === 'VERIFIED') {
    certDetails = `Verified by ${certifierName || 'recognized authority'}. Certificate: ${product?.certifications?.[0]?.certificateNumber || 'On file'}`;
  } else if (certStatus === 'REQUIRES_VERIFICATION') {
    certDetails = 'Packaging logo detected; secondary audit required to confirm expiration date.';
  }

  // 4. GLUTEN CHECK ENGINE
  const glutenPatterns = [
    /\b(wheat|barley|rye|spelt|triticale|semolina|malt|kamut|durum)\b/i,
    /\b(bl[ée]|orge|seigle|[ée]peautre|malt\s+d['’]orge|farine\s+de\s+bl[ée]|froment)\b/i,
    /\b(weizen|gerste|roggen|dinkel|gerstenmalz|weizenmehl|weizenst[äa]rke)\b/i,
    /\b(trigo|cebada|centeno|harina\s+de\s+trigo|malta)\b/i,
    /\b(grano|frumento|orzo|segale|farina\s+di\s+frumento)\b/i,
    /\b(pszenica|j[ęe]czmie[ńn]|[żz]yto|m[ąa]ka\s+pszenna)\b/i,
    /\b(bu[ğg]day|arpa|[çc]avdar)\b/i,
    /\b(قمح|شعير|شوفان|دقيق\s+القمح)\b/i,
  ];

  const flaggedGrains: string[] = [];
  for (const ing of analyzedIngredients) {
    const norm = ing.normalizedText.toLowerCase();
    for (const pat of glutenPatterns) {
      if (pat.test(norm)) {
        flaggedGrains.push(ing.rawText);
        break;
      }
    }
  }

  const containsGluten = flaggedGrains.length > 0;
  const glutenStatus = containsGluten ? 'CONTAINS_GLUTEN' : 'GLUTEN_FREE';
  const glutenExplanation = containsGluten
    ? `Contains gluten-containing grains: ${flaggedGrains.slice(0, 3).join(', ')}.`
    : 'No declared wheat, barley, rye, or gluten grains found on ingredient list.';

  // 5. KOSHER ASSESSMENT ENGINE
  const dairyPatterns = [
    /\b(milk|dairy|whey|lactose|casein|butter|cheese|cream|yogurt|curd)\b/i,
    /\b(lait|beurre|cr[èe]me|lactos[ée]rum|fromage|yaourt)\b/i,
    /\b(milch|butter|sahne|molke|k[äa]se|joghurt)\b/i,
    /\b(leche|mantequilla|queso|suero|nata)\b/i,
    /\b(latte|burro|formaggio|panna)\b/i,
    /\b(mleko|mas[łl]o|serwatka|ser)\b/i,
    /\b(s[üu]t|tereya[ğg][ıi]|peynir)\b/i,
    /\b(حليب|لبن|زبدة|جبن|مصل\s+اللبن)\b/i,
  ];

  let dairyDetected = false;
  let meatDetected = explicitPorkFound;

  for (const ing of analyzedIngredients) {
    const norm = ing.normalizedText.toLowerCase();
    for (const pat of dairyPatterns) {
      if (pat.test(norm)) {
        dairyDetected = true;
        break;
      }
    }
    if (/\b(beef|meat|bacon|ham|porc|viande|cerdo|carne|rind|fleisch)\b/i.test(norm)) {
      meatDetected = true;
    }
  }

  let kosherStatus: 'NOT_KOSHER' | 'KOSHER_DAIRY_COMPATIBLE' | 'KOSHER_PAREVE_COMPATIBLE' | 'SOURCE_VERIFICATION_REQUIRED' = 'KOSHER_PAREVE_COMPATIBLE';
  let kosherExplanation = 'No non-kosher ingredients detected (Pareve compatible).';

  if (explicitPorkFound || overallHalalStatus === 'PORK_DERIVED') {
    kosherStatus = 'NOT_KOSHER';
    kosherExplanation = 'Non-Kosher: Contains pork / porcine derivatives, strictly prohibited in Jewish dietary law.';
  } else if (analyzedIngredients.some((ing) => ing.matchedAdditive?.eNumber === 'E120')) {
    kosherStatus = 'NOT_KOSHER';
    kosherExplanation = 'Non-Kosher: Contains Carmine / Cochineal (E120) derived from insects.';
  } else if (meatDetected && dairyDetected) {
    kosherStatus = 'NOT_KOSHER';
    kosherExplanation = 'Non-Kosher: Product mixes meat and dairy ingredients, which violates Kashrut law.';
  } else if (verifyCount > 0) {
    kosherStatus = 'SOURCE_VERIFICATION_REQUIRED';
    kosherExplanation = 'Requires verification: Contains emulsifiers or gelling agents requiring Kosher certification.';
  } else if (dairyDetected) {
    kosherStatus = 'KOSHER_DAIRY_COMPATIBLE';
    kosherExplanation = 'Kosher Dairy compatible: Contains milk/dairy derivatives without non-kosher additives.';
  }

  // 6. VEGAN & VEGETARIAN ASSESSMENT
  const isVegetarian = !explicitPorkFound && prohibitedCount === 0 && !meatDetected && !analyzedIngredients.some((i) => i.matchedIngredient?.id === 'ING_ANIMAL_RENNET');
  const isVegan = isVegetarian && !dairyDetected && !analyzedIngredients.some((i) => i.matchedIngredient?.family === 'Dairy Derivative');
  const veganExplanation = isVegan
    ? '100% Plant-Based: No meat, poultry, dairy, egg, or animal derivatives detected.'
    : isVegetarian
    ? 'Vegetarian: Contains dairy but free from slaughtered meat tissue or animal fats.'
    : 'Contains animal tissue, pork, or slaughter-derived fats.';

  // 7. DETECTED ADDITIVES EXTRACTION
  const detectedAdditives = analyzedIngredients
    .filter((ing) => ing.matchedAdditive !== undefined)
    .map((ing) => ing.matchedAdditive!)
    .filter((add, index, self) => index === self.findIndex((a) => a.eNumber === add.eNumber));

  // 8. CONFIDENCE ENGINE (Section 23)
  let baseScore = 90;
  if (ocrConfidence < 85) baseScore -= 15;
  if (langConfidence < 70) baseScore -= 10;
  if (verifyCount > 0) baseScore -= Math.min(25, verifyCount * 8);
  if (product?.dataQualityScore) {
    baseScore = Math.round((baseScore + product.dataQualityScore) / 2);
  }
  const confidenceScore = Math.max(35, Math.min(99, baseScore));

  let confidenceLevel: ConfidenceLevel = 'HIGH';
  if (confidenceScore < 65) confidenceLevel = 'LOW';
  else if (confidenceScore < 85) confidenceLevel = 'MEDIUM';

  return {
    product,
    inputRawText: ingredientText,
    detectedLanguage: language,
    languageConfidence: langConfidence,
    analyzedIngredients,
    porkCheck: {
      status: porkStatus,
      explicitPorkFound,
      possiblePorkFound,
      explanation: porkExplanation,
      flaggedIngredients: flaggedPorkIngredients,
      confidence: confidenceLevel,
    },
    halalAnalysis: {
      status: overallHalalStatus,
      summary,
      recommendation,
      totalAnalyzed: analyzedIngredients.length,
      noConcernCount,
      verifyCount,
      prohibitedCount,
      confidence: confidenceLevel,
      confidenceScore,
    },
    glutenCheck: {
      status: glutenStatus,
      containsGluten,
      explanation: glutenExplanation,
      flaggedGrains,
    },
    kosherCheck: {
      status: kosherStatus,
      explanation: kosherExplanation,
      dairyDetected,
      meatDetected,
    },
    veganCheck: {
      isVegan,
      isVegetarian,
      explanation: veganExplanation,
    },
    detectedAdditives,
    certification: {
      status: certStatus,
      certifierName,
      details: certDetails,
    },
    provenance: {
      source: product?.externalSource || 'Packaging Label Analysis',
      lastVerified: product?.lastVerified || new Date().toISOString().split('T')[0],
      engineVersion: 'HALALENS Core Engine v2.4 (Deterministic Multi-Standard)',
      ruleSet: 'EU 1169/2011 & International Halal Food Standards (JAKIM/GSO/OIC SMIIC)',
    },
  };
}

// Generates localized inquiry letter for manufacturer (Section 39)
export function generateManufacturerInquiry(
  productName: string,
  brand: string,
  ambiguousIngredients: string[],
  language = 'en'
): { subject: string; body: string } {
  const ingList = ambiguousIngredients.join(', ');

  switch (language) {
    case 'fr':
      return {
        subject: `Demande d'information sur la composition du produit: ${productName} (${brand})`,
        body: `Madame, Monsieur,\n\nJe suis consommateur de votre produit "${productName}" (Marque: ${brand}) et j'aimerais avoir une précision concernant les ingrédients utilisés.\n\nPourriez-vous me confirmer l'origine exacte des ingrédients suivants: ${ingList}?\n\nS'agit-il d'ingrédients d'origine exclusivement végétale/synthétique, ou des graisses ou enzymes d'origine animale (bovine, ovine ou porcine) sont-elles employées lors de leur fabrication?\n\nVotre produit bénéficie-t-il par ailleurs d'une certification Halal ou Végétarienne officielle?\n\nEn vous remerciant par avance pour votre transparence,\nCordialement.`,
      };
    case 'de':
      return {
        subject: `Anfrage zur Herkunft der Inhaltsstoffe: ${productName} (${brand})`,
        body: `Sehr geehrte Damen und Herren,\n\nich interessiere mich für Ihr Produkt "${productName}" (${brand}) und hätte eine Frage zur Herkunft der Zutaten.\n\nKönnten Sie mir bitte mitteilen, ob die folgenden Inhaltsstoffe (${ingList}) rein pflanzlichen/synthetischen Ursprungs sind oder tierische Fette (Rind, Schwein) bei der Herstellung verwendet werden?\n\nVerfügt das Produkt zudem über ein offizielles Halal- oder Vegetarisch-Zertifikat?\n\nVielen Dank für Ihre Unterstützung.\nMit freundlichen Grüßen.`,
      };
    case 'it':
      return {
        subject: `Richiesta di informazioni sugli ingredienti: ${productName} (${brand})`,
        body: `Gentile Servizio Clienti,\n\nVi scrivo in merito al prodotto "${productName}" a marchio ${brand}.\n\nVorrei sapere se i seguenti ingredienti (${ingList}) sono di origine esclusivamente vegetale oppure se provengono da grassi animali (incluso maiale o bovino).\n\nIl prodotto dispone inoltre di una certificazione Halal o Vegetariana?\n\nRingraziandoVi per la cortese attenzione,\nCordiali saluti.`,
      };
    case 'es':
      return {
        subject: `Consulta sobre los ingredientes del producto: ${productName} (${brand})`,
        body: `Estimado equipo de atención al cliente,\n\nMe pongo en contacto respecto al producto "${productName}" de la marca ${brand}.\n\n¿Podrían confirmarme si los siguientes ingredientes (${ingList}) son de origen 100% vegetal o si se emplean grasas o derivados de origen animal (porcino o bovino) en su elaboración?\n\n¿Cuenta el producto con alguna certificación Halal reconocida?\n\nMuchas gracias por su atención.\nAtentamente.`,
      };
    default:
      return {
        subject: `Ingredient origin inquiry: ${productName} (${brand})`,
        body: `Dear Customer Service,\n\nI am writing to inquire about the sourcing of ingredients in your product "${productName}" (${brand}).\n\nCould you please clarify the exact source of the following ingredients: ${ingList}?\n\nAre these derived strictly from 100% vegetable or synthetic sources, or are animal fats (including porcine or bovine origins) or animal enzymes utilized during manufacturing?\n\nAdditionally, does this product hold any official Halal or Vegetarian certification?\n\nThank you very much for your time and transparency.\nBest regards.`,
      };
  }
}
