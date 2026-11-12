export interface DishItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  available?: boolean;
}

export const ADMIN_SECRET_PASSWORD = 'elfogon';
export const GOOGLE_MAPS_OFFICIAL_URL =
  'https://www.google.com/maps/place/El+Fog%C3%B3n/@-34.9070622,-56.1928837,17z/data=!3m1!4b1!4m6!3m5!1s0x959f81cd5c70a2b1:0x64a7dbcfe1cafd59!8m2!3d-34.9070622!4d-56.1928837!16s%2Fg%2F1tg36df7?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D';
export const DIRECT_WHATSAPP_URL = 'https://wa.me/59899621962';

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterMenuDishes(
  dishes: DishItem[],
  category: string,
  searchQuery: string,
  onlyAvailable = true
): DishItem[] {
  const normalizedQuery = normalizeSearchText(searchQuery);
  return dishes.filter((dish) => {
    if (onlyAvailable && dish.available === false) return false;
    const matchesCategory =
      !category || category === 'todas' || dish.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = normalizeSearchText(
      `${dish.name} ${dish.description} ${dish.category} ${dish.badge || ''}`
    );
    return haystack.includes(normalizedQuery);
  });
}

export function verifyAdminPassword(input: string): boolean {
  return input.trim() === ADMIN_SECRET_PASSWORD;
}

export function checkSecretKeySequence(buffer: string, nextKey: string): {
  nextBuffer: string;
  triggered: boolean;
} {
  if (!nextKey || nextKey.length !== 1) {
    return { nextBuffer: buffer, triggered: false };
  }
  const updated = (buffer + nextKey.toLowerCase()).slice(-5);
  return {
    nextBuffer: updated,
    triggered: updated === 'admin',
  };
}

export function updateDishInList(
  dishes: DishItem[],
  updatedDish: DishItem
): DishItem[] {
  return dishes.map((item) => (item.id === updatedDish.id ? { ...updatedDish } : item));
}

export function addDishToList(dishes: DishItem[], newDish: DishItem): DishItem[] {
  return [newDish, ...dishes];
}

export function deleteDishFromList(dishes: DishItem[], dishId: string): DishItem[] {
  return dishes.filter((item) => item.id !== dishId);
}

export function formatUYUPrice(price: number): string {
  const safePrice = Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
  return '$ ' + safePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function getDirectWhatsAppUrl(phone = '59899621962'): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}`;
}
