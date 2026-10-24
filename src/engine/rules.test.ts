/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { matchSingleIngredient } from './normalization';
import { runHalalAnalysis } from './classification';

export function runAutomatedClassificationTests(): { passed: number; failed: number; log: string[] } {
  const log: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      log.push(`✓ PASS: ${testName}`);
    } else {
      failed++;
      log.push(`✗ FAIL: ${testName}`);
      console.error(`Test failed: ${testName}`);
    }
  }

  // 1. Pork gelatin -> explicit pork
  const test1 = matchSingleIngredient('pork gelatin', 'en');
  assert(test1.porkStatus === 'PORK_DETECTED', 'pork gelatin -> PORK_DETECTED');

  // 2. French pork gelatin -> explicit pork
  const test2 = matchSingleIngredient('gélatine de porc', 'fr');
  assert(test2.porkStatus === 'PORK_DETECTED', 'gélatine de porc -> PORK_DETECTED');

  // 3. German Schweinefett / Schweinegelatine
  const test3 = matchSingleIngredient('Schweinegelatine', 'de');
  assert(test3.porkStatus === 'PORK_DETECTED', 'Schweinegelatine -> PORK_DETECTED');

  // 4. French saindoux -> pork
  const test4 = matchSingleIngredient('saindoux', 'fr');
  assert(test4.porkStatus === 'PORK_DETECTED', 'saindoux -> PORK_DETECTED');

  // 5. Spanish grasa de cerdo -> pork
  const test5 = matchSingleIngredient('grasa de cerdo', 'es');
  assert(test5.porkStatus === 'PORK_DETECTED', 'grasa de cerdo -> PORK_DETECTED');

  // 6. Fish gelatin -> NOT pork, Halal
  const test6 = matchSingleIngredient('fish gelatin', 'en');
  assert(test6.porkStatus === 'NO_PORK_DETECTED' && test6.halalStatus === 'HALAL', 'fish gelatin -> Halal, no pork');

  // 7. Halal beef gelatin -> Halal
  const test7 = matchSingleIngredient('halal beef gelatin', 'en');
  assert(test7.porkStatus === 'NO_PORK_DETECTED' && test7.halalStatus === 'HALAL', 'halal beef gelatin -> Halal');

  // 8. E471 unspecified -> source dependent
  const test8 = matchSingleIngredient('mono- and diglycerides of fatty acids (E471)', 'en');
  assert(test8.halalStatus === 'SOURCE_DEPENDENT', 'E471 -> SOURCE_DEPENDENT');

  // 9. Vegetable E471 -> plant based
  const test9 = matchSingleIngredient('mono- et diglycérides d\'origine végétale', 'fr');
  assert(test9.halalStatus === 'PLANT_BASED', 'vegetable E471 -> PLANT_BASED');

  // 10. Microbial rennet -> Halal
  const test10 = matchSingleIngredient('présure microbienne', 'fr');
  assert(test10.halalStatus === 'HALAL', 'présure microbienne -> HALAL');

  // 11. Animal rennet -> source dependent
  const test11 = matchSingleIngredient('présure animale', 'fr');
  assert(test11.halalStatus === 'SOURCE_DEPENDENT', 'présure animale -> SOURCE_DEPENDENT');

  // 12. Full French marshmallow analysis
  const fullAnalysis = runHalalAnalysis('Sirop de glucose, sucre, gélatine de porc, arôme vanille');
  assert(fullAnalysis.porkCheck.status === 'PORK_DETECTED', 'Full product with gélatine de porc -> PORK_DETECTED');

  return { passed, failed, log };
}
