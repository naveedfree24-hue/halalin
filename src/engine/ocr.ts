/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sample package ingredient label captures for instant testing & demonstrations
export interface SampleIngredientLabel {
  id: string;
  title: string;
  brand: string;
  country: string;
  language: string;
  rawText: string;
  expectedPorkStatus: 'PORK_DETECTED' | 'POSSIBLE_PORK_SOURCE' | 'NO_PORK_DETECTED';
  expectedHalalStatus: string;
  packagingMockColor: string;
}

export const SAMPLE_INGREDIENT_LABELS: SampleIngredientLabel[] = [
  {
    id: 'sample_french_saucisse_porc',
    title: 'Saucisse de Porc (French Pork Sausage)',
    brand: 'Charcuterie de France',
    country: '🇫🇷 France',
    language: 'fr',
    rawText: 'Ingrédients: Viande de porc (origine France) 90%, gras de porc, sel, lactose, épices, dextrose, ail, boyau naturel de porc, conservateur: nitrite de sodium.',
    expectedPorkStatus: 'PORK_DETECTED',
    expectedHalalStatus: 'PORK_DERIVED',
    packagingMockColor: 'from-rose-950 to-slate-900',
  },
  {
    id: 'sample_french_marshmallow',
    title: 'Chamallows Guimauves (French Packaging)',
    brand: 'Haribo France',
    country: '🇫🇷 France',
    language: 'fr',
    rawText: 'Ingrédients: Sirop de glucose, sucre, gélatine de porc, dextrose, sucre glace, arôme naturel de vanille, colorant: carmins.',
    expectedPorkStatus: 'PORK_DETECTED',
    expectedHalalStatus: 'PORK_DERIVED',
    packagingMockColor: 'from-pink-950 to-slate-900',
  },
  {
    id: 'sample_german_gummy',
    title: 'Goldbären Fruchtgummi (German Formulation)',
    brand: 'Haribo Deutschland',
    country: '🇩🇪 Germany',
    language: 'de',
    rawText: 'Zutaten: Glukosesirup; Zucker; Gelatine (Schwein); Dextrose; Fruchtsaft aus Fruchtsaftkonzentrat; Säuerungsmittel: Citronensäure; pflanzliche Konzentrate; Überzugsmittel: Bienenwachs.',
    expectedPorkStatus: 'PORK_DETECTED',
    expectedHalalStatus: 'PORK_DERIVED',
    packagingMockColor: 'from-amber-950 to-slate-900',
  },
  {
    id: 'sample_french_biscuit',
    title: 'Nutella Biscuits (French Pack)',
    brand: 'Ferrero France',
    country: '🇫🇷 France',
    language: 'fr',
    rawText: 'Ingrédients: Farine de froment 32,5%, sucre, huile de palme, noisettes 13%, lait écrémé en poudre, cacao maigre, émulsifiant: mono- et diglycérides d\'acides gras (E471), arômes naturels.',
    expectedPorkStatus: 'POSSIBLE_PORK_SOURCE',
    expectedHalalStatus: 'SOURCE_DEPENDENT',
    packagingMockColor: 'from-orange-950 to-slate-900',
  },
  {
    id: 'sample_uk_biscoff',
    title: 'Lotus Biscoff Spread (UK/EU Label)',
    brand: 'Lotus Bakeries',
    country: '🇧🇪 Belgium / 🇬🇧 UK',
    language: 'en',
    rawText: 'Ingredients: Original caramelised biscuits 58% (wheat flour, sugar, vegetable oils [palm, rapeseed], candy sugar syrup, raising agent: sodium hydrogen carbonate, soya flour, salt, cinnamon), rapeseed oil, sugar, emulsifier: soya lecithin, acid: citric acid.',
    expectedPorkStatus: 'NO_PORK_DETECTED',
    expectedHalalStatus: 'PLANT_BASED',
    packagingMockColor: 'from-red-950 to-slate-900',
  },
  {
    id: 'sample_italian_pasta_sauce',
    title: 'Sugo al Basilico (Italian Pack)',
    brand: 'Barilla Italia',
    country: '🇮🇹 Italy',
    language: 'it',
    rawText: 'Ingredienti: Polpa di pomodoro 71%, concentrato di pomodoro 14%, cipolla, olio di semi di girasole, basilico 2%, zucchero, sale, aroma naturale.',
    expectedPorkStatus: 'NO_PORK_DETECTED',
    expectedHalalStatus: 'PLANT_BASED',
    packagingMockColor: 'from-emerald-950 to-slate-900',
  },
  {
    id: 'sample_halal_beef_gelatin',
    title: 'Halal Certified Gummy Bears (Turkey Export)',
    brand: 'Bebeto / Haribo Turkey',
    country: '🇹🇷 Turkey',
    language: 'en',
    rawText: 'Ingredients: Glucose syrup, sugar, halal beef gelatin, apple juice from concentrate, acidity regulator: citric acid, natural flavours, carnauba wax.',
    expectedPorkStatus: 'NO_PORK_DETECTED',
    expectedHalalStatus: 'HALAL',
    packagingMockColor: 'from-teal-950 to-slate-900',
  },
  {
    id: 'sample_spanish_chorizo',
    title: 'Chorizo Ibérico Loncheado (Spanish Packaging)',
    brand: 'Embutidos España',
    country: '🇪🇸 Spain',
    language: 'es',
    rawText: 'Ingredientes: Carne de cerdo, grasa de cerdo, pimentón dulce, sal, ajo, dextrina, proteína de soja, conservador: nitrito sódico.',
    expectedPorkStatus: 'PORK_DETECTED',
    expectedHalalStatus: 'PORK_DERIVED',
    packagingMockColor: 'from-rose-950 to-slate-900',
  },
];

// Helper to check if Native Barcode Detector is supported
export async function detectBarcodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      // @ts-expect-error - standard modern browser BarcodeDetector API
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'],
      });
      const barcodes = await detector.detect(canvas);
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    } catch {
      // Fallback
    }
  }
  return null;
}
