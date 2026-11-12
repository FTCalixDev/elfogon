import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSearchText,
  filterMenuDishes,
  verifyAdminPassword,
  checkSecretKeySequence,
  updateDishInList,
  addDishToList,
  deleteDishFromList,
  formatUYUPrice,
  getDirectWhatsAppUrl,
  GOOGLE_MAPS_OFFICIAL_URL,
  type DishItem,
} from './menuLogic';

const sampleDishes: DishItem[] = [
  {
    id: 'dry-aged-1',
    name: 'Costilla Dry Aged*',
    category: 'vacunos',
    description: 'Madurada 30 días',
    price: 1690,
    image: '/assets/menu/pdf_img_05.jpg',
    badge: 'Recomendado',
    available: true,
  },
  {
    id: 'pasta-1',
    name: 'Raviolones de salmón',
    category: 'pastas',
    description: 'Con salsa de mariscos',
    price: 920,
    image: '/assets/menu/pdf_img_04.jpg',
    available: true,
  },
  {
    id: 'entrada-1',
    name: 'Provolone “Fogón”',
    category: 'entradas',
    description: 'Jamón, tomate, morrón y panceta',
    price: 590,
    image: '/assets/menu/pdf_img_02.jpg',
    available: false,
  },
];

test('normalizeSearchText strips diacritics and lowercases accurately', () => {
  assert.equal(normalizeSearchText('  Raviolones de Salmón '), 'raviolones de salmon');
  assert.equal(normalizeSearchText('Ñoquis con Roquefort'), 'noquis con roquefort');
});

test('filterMenuDishes filters by category, accent-insensitive query, and availability', () => {
  const allAvailable = filterMenuDishes(sampleDishes, 'todas', '');
  assert.equal(allAvailable.length, 2);

  const salmonSearch = filterMenuDishes(sampleDishes, 'todas', 'salmon');
  assert.equal(salmonSearch.length, 1);
  assert.equal(salmonSearch[0].id, 'pasta-1');

  const adminViewAll = filterMenuDishes(sampleDishes, 'entradas', 'fogon', false);
  assert.equal(adminViewAll.length, 1);
  assert.equal(adminViewAll[0].id, 'entrada-1');
});

test('verifyAdminPassword only accepts elfogon', () => {
  assert.equal(verifyAdminPassword('elfogon'), true);
  assert.equal(verifyAdminPassword('  elfogon  '), true);
  assert.equal(verifyAdminPassword('admin123'), false);
  assert.equal(verifyAdminPassword('ElFogon'), false);
});

test('checkSecretKeySequence detects typing admin anywhere on the page', () => {
  let buf = '';
  for (const ch of ['x', 'y', 'a', 'd', 'm', 'i']) {
    const res = checkSecretKeySequence(buf, ch);
    buf = res.nextBuffer;
    assert.equal(res.triggered, false);
  }
  const finalRes = checkSecretKeySequence(buf, 'n');
  assert.equal(finalRes.nextBuffer, 'admin');
  assert.equal(finalRes.triggered, true);
});

test('CRUD operations update, add, and delete dishes immutably', () => {
  const updated = updateDishInList(sampleDishes, {
    ...sampleDishes[0],
    price: 1750,
  });
  assert.equal(updated[0].price, 1750);
  assert.equal(sampleDishes[0].price, 1690);

  const added = addDishToList(sampleDishes, {
    id: 'postre-1',
    name: 'Flan casero',
    category: 'postres',
    description: 'Postre casero tradicional',
    price: 340,
    image: '/assets/menu/pdf_img_07.jpg',
    available: true,
  });
  assert.equal(added.length, 4);
  assert.equal(added[0].id, 'postre-1');

  const deleted = deleteDishFromList(added, 'postre-1');
  assert.equal(deleted.length, 3);
});

test('formatUYUPrice and getDirectWhatsAppUrl return clean direct links without automatic text', () => {
  assert.equal(formatUYUPrice(1690), '$ 1.690');
  assert.equal(formatUYUPrice(590), '$ 590');

  const url = getDirectWhatsAppUrl('59899621962');
  assert.equal(url, 'https://wa.me/59899621962');
  assert.equal(url.includes('?text='), false);
  assert.ok(GOOGLE_MAPS_OFFICIAL_URL.includes('-34.9070622,-56.1928837'));
});
