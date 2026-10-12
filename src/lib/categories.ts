export type CategoryId =
  | 'food'
  | 'cleaning'
  | 'laundry'
  | 'care'
  | 'shopping'
  | 'family'
  | 'admin'
  | 'other';

type Category = {
  // A word matches if it STARTS with a stem ("cocin" -> cocinar, cocinando...)
  stems: string[];
  // Short words that must match whole, or "cole" would also catch "colega"
  exact: string[];
};

// Order = priority: the first category with a match wins.
// "Comer con tus padres" has a food word AND a family word; family must win.
export const CATEGORIES: Record<CategoryId, Category> = {
  family: {
    stems: ['padre', 'madre', 'suegr', 'abuel', 'navidad', 'cumple', 'familia', 'cunad'],
    exact: ['tio', 'tia', 'tios', 'tias', 'papa', 'mama', 'papas'],
  },
  care: {
    stems: ['nino', 'nina', 'hij', 'bebe', 'pediatr', 'medico', 'doctor', 'guarderia', 'colegio', 'deberes'],
    exact: ['cole'],
  },
  shopping: {
    stems: ['compra', 'farmaci', 'mercad', 'supermercado'],
    exact: ['super'],
  },
  cleaning: {
    stems: ['limpi', 'bano', 'aspir', 'fregar', 'friega', 'plato', 'lavavajilla', 'barrer', 'polvo', 'basura'],
    exact: [],
  },
  // before laundry, so "Reparar la lavadora" is a repair (admin), not laundry
  admin: {
    stems: ['factura', 'papeles', 'gestion', 'repara', 'arregl', 'tramite', 'seguro', 'banco', 'impuesto', 'contrat'],
    exact: ['cita', 'citas'],
  },
  laundry: {
    stems: ['lavadora', 'tender', 'tendi', 'planch', 'ropa', 'colada', 'doblar'],
    exact: [],
  },
  food: {
    // "comer" is exact: as a stem it would also match "comercio"
    stems: ['cena', 'comid', 'cocin', 'desayun', 'almuerz', 'merienda', 'receta'],
    exact: ['comer', 'comemos', 'comiendo'],
  },
  other: {
    stems: [],
    exact: [],
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: string): value is CategoryId {
  return value in CATEGORIES;
}

// "Baño" -> "bano": lowercase and drop accents so people don't have to type them
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function detectCategory(text: string): CategoryId {
  const words = normalize(text).split(/[^a-z0-9]+/).filter(Boolean);

  for (const id of CATEGORY_IDS) {
    const { stems, exact } = CATEGORIES[id];
    const hit = words.some(
      (word) => exact.includes(word) || stems.some((stem) => word.startsWith(stem)),
    );
    if (hit) return id;
  }
  return 'other';
}
