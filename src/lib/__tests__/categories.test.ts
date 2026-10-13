import { CATEGORY_IDS, detectCategory, isCategoryId } from '../categories';

describe('detectCategory', () => {
  // [text, expected category]
  const cases: [string, string][] = [
    ['Cena de Navidad', 'family'],
    ['Hice la cena', 'food'],
    ['Cocinar', 'food'],
    ['Limpié el baño', 'cleaning'],
    ['Puse el lavavajillas', 'cleaning'],
    ['Sacar la basura', 'cleaning'],
    ['Puse la lavadora', 'laundry'],
    ['Tender la ropa', 'laundry'],
    ['Recoger a los niños del cole', 'care'],
    ['Llevar al pediatra', 'care'],
    ['Comprar la cena', 'shopping'],
    ['Ir al súper', 'shopping'],
    ['Pagar la factura', 'admin'],
    ['Pedir cita', 'admin'],
    ['Cosa rara', 'other'],
    ['', 'other'],
  ];

  it.each(cases)('"%s" is %s', (text, expected) => {
    expect(detectCategory(text)).toBe(expected);
  });

  it('puts family before food: "Comer con tus padres" is a family thing', () => {
    expect(detectCategory('Comer con tus padres')).toBe('family');
  });

  it('is not fooled by words that merely start like a keyword', () => {
    expect(detectCategory('Hablar con mi colega')).toBe('other'); // not "cole"
    expect(detectCategory('Visitar el comercio local')).toBe('other'); // not "comer"
  });

  it('matches whole short words: "comer" and its forms are food', () => {
    expect(detectCategory('Vamos a comer')).toBe('food');
    expect(detectCategory('Comiendo fuera')).toBe('food');
  });

  it('treats a repair as admin even when it mentions an appliance', () => {
    expect(detectCategory('Reparar la lavadora')).toBe('admin');
    expect(detectCategory('Poner la lavadora')).toBe('laundry');
  });

  it('ignores accents and capitals', () => {
    expect(detectCategory('BAÑO')).toBe('cleaning');
    expect(detectCategory('bano')).toBe('cleaning');
  });
});

describe('category ids', () => {
  it('knows its own ids and rejects anything else', () => {
    for (const id of CATEGORY_IDS) expect(isCategoryId(id)).toBe(true);
    expect(isCategoryId('whatever')).toBe(false);
    expect(isCategoryId('')).toBe(false);
  });

  it('always has an "other" fallback', () => {
    expect(CATEGORY_IDS).toContain('other');
  });
});
