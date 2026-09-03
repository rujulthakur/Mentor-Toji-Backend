/** Standard adult daily reference values (FDA/NIH general adult RDAs — a
 * reasonable single baseline since we don't collect the age/sex-specific
 * micronutrient tables during onboarding). Used only to compute the "%
 * of daily value" shown on the micronutrient progress bars. */
export const MICRONUTRIENT_RDA = {
  vitaminAMcg: 900,
  vitaminBComplexMg: 2.4, // proxy for B12; "B complex" is displayed as one combined bar
  vitaminCMg: 90,
  vitaminDMcg: 20,
  vitaminEMg: 15,
  vitaminKMcg: 120,
  calciumMg: 1300,
  ironMg: 18,
  magnesiumMg: 420,
  potassiumMg: 4700,
  zincMg: 11,
  phosphorusMg: 1250,
  seleniumMcg: 55,
} as const

export const MICRONUTRIENT_LABELS: Record<keyof typeof MICRONUTRIENT_RDA, string> = {
  vitaminAMcg: 'Vitamin A',
  vitaminBComplexMg: 'Vitamin B Complex',
  vitaminCMg: 'Vitamin C',
  vitaminDMcg: 'Vitamin D',
  vitaminEMg: 'Vitamin E',
  vitaminKMcg: 'Vitamin K',
  calciumMg: 'Calcium',
  ironMg: 'Iron',
  magnesiumMg: 'Magnesium',
  potassiumMg: 'Potassium',
  zincMg: 'Zinc',
  phosphorusMg: 'Phosphorus',
  seleniumMcg: 'Selenium',
}

export const MICRONUTRIENT_UNITS: Record<keyof typeof MICRONUTRIENT_RDA, string> = {
  vitaminAMcg: 'mcg',
  vitaminBComplexMg: 'mg',
  vitaminCMg: 'mg',
  vitaminDMcg: 'mcg',
  vitaminEMg: 'mg',
  vitaminKMcg: 'mcg',
  calciumMg: 'mg',
  ironMg: 'mg',
  magnesiumMg: 'mg',
  potassiumMg: 'mg',
  zincMg: 'mg',
  phosphorusMg: 'mg',
  seleniumMcg: 'mcg',
}

export interface Macros {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
}

export const EMPTY_MACROS: Macros = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarG: 0,
  sodiumMg: 0,
}

export type Micronutrients = Record<keyof typeof MICRONUTRIENT_RDA, number>

export const EMPTY_MICRONUTRIENTS: Micronutrients = Object.fromEntries(
  Object.keys(MICRONUTRIENT_RDA).map((k) => [k, 0])
) as Micronutrients
