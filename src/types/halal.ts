/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HalalStatus =
  | 'HALAL'
  | 'PLANT_BASED'
  | 'SYNTHETIC_MINERAL'
  | 'SOURCE_DEPENDENT'
  | 'MASHBOOH'
  | 'NOT_HALAL'
  | 'PORK_DERIVED'
  | 'UNKNOWN';

export type PorkStatus =
  | 'NO_PORK_DETECTED'
  | 'POSSIBLE_PORK_SOURCE'
  | 'PORK_DETECTED';

export type GlutenStatus =
  | 'GLUTEN_FREE'
  | 'CONTAINS_GLUTEN'
  | 'MAY_CONTAIN_GLUTEN';

export type KosherStatus =
  | 'KOSHER_PAREVE_COMPATIBLE'
  | 'KOSHER_DAIRY_COMPATIBLE'
  | 'KOSHER_CERTIFIED'
  | 'NOT_KOSHER'
  | 'SOURCE_VERIFICATION_REQUIRED';

export type CertificationStatus =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'REQUIRES_VERIFICATION'
  | 'LOGO_DETECTED_UNVERIFIED';

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IngredientSource {
  sourceType: 'plant' | 'animal' | 'microbial' | 'synthetic' | 'mineral' | 'insect';
  species?: string;
  porkPossible: boolean;
  notes: string;
}

export interface CanonicalIngredient {
  id: string;
  canonicalName: string;
  scientificName?: string;
  family: string;
  description: string;
  commonUses?: string;
  eNumber?: string;
  insNumber?: string;
  halalStatus: HalalStatus;
  porkStatus: PorkStatus;
  riskLevel: RiskLevel;
  verificationRequired: boolean;
  reason: string;
  scientificDetails?: string;
  possibleSources: IngredientSource[];
  aliases: Record<string, string[]>; // languageCode -> list of aliases
}

export interface Additive {
  eNumber: string;
  insNumber?: string;
  name: string;
  aliases: string[];
  function: string;
  halalStatus: HalalStatus;
  porkStatus: PorkStatus;
  riskLevel: RiskLevel;
  animalOriginPossible: boolean;
  porkOriginPossible: boolean;
  verificationRequired: boolean;
  reason: string;
  recommendation: string;
  scientificDetails: string;
  commonIn: string[];
}

export interface CertificationAuthority {
  id: string;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
  logo: string;
  website: string;
  verificationUrl?: string;
  scope: string;
  recognizedRegions: string[];
  trustLevel: 'HIGHLY_RECOGNIZED' | 'REGIONAL_AUTHORITY' | 'REQUIRES_CROSS_CHECK';
  standardsBody: string;
  verified: boolean;
}

export interface AnalyzedIngredient {
  rawText: string;
  normalizedText: string;
  matchedIngredient?: CanonicalIngredient;
  matchedAdditive?: Additive;
  halalStatus: HalalStatus;
  porkStatus: PorkStatus;
  riskLevel: RiskLevel;
  flagged: boolean;
  needsSourceVerification: boolean;
  reason: string;
  overrideContext?: string; // e.g., "beef gelatin" detected rather than generic "gelatin"
  detectedLanguage?: string;
}

export interface ProductVersion {
  versionId: string;
  market: string;
  ingredientText: string;
  verifiedDate: string;
  source: string;
}

export interface Product {
  id: string;
  gtin: string;
  ean: string;
  barcodeType: 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'QR';
  name: string;
  brand: string;
  manufacturer: string;
  category: string;
  subcategory?: string;
  marketCountry: string;
  marketCountryCode: string;
  countriesSold: string[];
  packageSize: string;
  imageUrl: string;
  ingredientsRaw: string;
  ingredientsLanguage: string;
  allergens: string[];
  certifications: {
    certifierId?: string;
    certifierName?: string;
    certificateNumber?: string;
    status: CertificationStatus;
    evidenceUrl?: string;
  }[];
  externalSource: string;
  dataQualityScore: number; // 0-100
  lastVerified: string;
  versions?: ProductVersion[];
}

export interface AnalysisResult {
  product?: Product;
  inputRawText?: string;
  detectedLanguage: string;
  languageConfidence: number; // 0-100
  analyzedIngredients: AnalyzedIngredient[];
  porkCheck: {
    status: PorkStatus;
    explicitPorkFound: boolean;
    possiblePorkFound: boolean;
    explanation: string;
    flaggedIngredients: string[];
    confidence: ConfidenceLevel;
  };
  halalAnalysis: {
    status: HalalStatus;
    summary: string;
    recommendation: string;
    totalAnalyzed: number;
    noConcernCount: number;
    verifyCount: number;
    prohibitedCount: number;
    confidence: ConfidenceLevel;
    confidenceScore: number; // 0-100
  };
  glutenCheck: {
    status: GlutenStatus;
    containsGluten: boolean;
    explanation: string;
    flaggedGrains: string[];
  };
  kosherCheck: {
    status: KosherStatus;
    explanation: string;
    dairyDetected: boolean;
    meatDetected: boolean;
  };
  veganCheck: {
    isVegan: boolean;
    isVegetarian: boolean;
    explanation: string;
  };
  detectedAdditives: Additive[];
  certification: {
    status: CertificationStatus;
    certifierName?: string;
    details: string;
  };
  provenance: {
    source: string;
    lastVerified: string;
    engineVersion: string;
    ruleSet: string;
  };
}

export interface DietaryFilterPreferences {
  porkFreeOnly: boolean;
  strictHalalCertified: boolean;
  avoidAlcohol: boolean;
  vegetarian: boolean;
  vegan: boolean;
  avoidGelatin: boolean;
  avoidCarmineE120: boolean;
  avoidShellacE904: boolean;
  allergens: {
    gluten: boolean;
    peanuts: boolean;
    treeNuts: boolean;
    dairy: boolean;
    soy: boolean;
    eggs: boolean;
    shellfish: boolean;
  };
}

export interface CommunitySubmission {
  id: string;
  productName: string;
  brand: string;
  barcode?: string;
  country: string;
  ingredientsText: string;
  imageProofUrl?: string;
  contributorName: string;
  timestamp: string;
  status: 'PENDING' | 'SPECIALIST_REVIEWED' | 'VERIFIED' | 'REJECTED';
  upvotes: number;
}
