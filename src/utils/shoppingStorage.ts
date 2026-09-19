import type { ShoppingList, ShoppingItem } from '../types';

export function generateShoppingId(prefix: 'list' | 'item' = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function calculateListProgress(list: ShoppingList): {
  checkedCount: number;
  totalCount: number;
  percent: number;
} {
  const totalCount = list.items.length;
  const checkedCount = list.items.filter(item => item.checked).length;
  const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  return { checkedCount, totalCount, percent };
}

/**
 * Creates a new ShoppingList object.
 */
export function createShoppingList(
  name: string,
  isTemplate = false,
  items: Array<Partial<ShoppingItem> & { name: string }> = []
): ShoppingList {
  const now = new Date().toISOString();
  return {
    id: generateShoppingId('list'),
    name: name.trim() || (isTemplate ? 'Untitled Template' : 'New List'),
    createdAt: now,
    updatedAt: now,
    isTemplate,
    items: items.map(it => ({
      id: 'id' in it && it.id ? it.id : generateShoppingId('item'),
      name: it.name.trim(),
      quantity: it.quantity?.trim() || undefined,
      checked: Boolean(it.checked),
      notes: it.notes?.trim() || undefined,
    })),
  };
}

/**
 * Duplicates an existing list into a reusable template with unchecked items.
 */
export function duplicateAsTemplate(
  list: ShoppingList,
  templateName?: string
): ShoppingList {
  const now = new Date().toISOString();
  return {
    id: generateShoppingId('list'),
    name: templateName?.trim() || `${list.name} (Template)`,
    createdAt: now,
    updatedAt: now,
    isTemplate: true,
    category: list.category,
    items: list.items.map(it => ({
      id: generateShoppingId('item'),
      name: it.name,
      quantity: it.quantity,
      checked: false, // Reset checked state for template
      notes: it.notes,
    })),
  };
}

/**
 * Creates a fresh active list instance from an existing template.
 */
export function createListFromTemplate(
  template: ShoppingList,
  newName?: string
): ShoppingList {
  const now = new Date().toISOString();
  return {
    id: generateShoppingId('list'),
    name: newName?.trim() || template.name.replace(/\s*\(Template\)$/i, ''),
    createdAt: now,
    updatedAt: now,
    isTemplate: false,
    category: template.category,
    items: template.items.map(it => ({
      id: generateShoppingId('item'),
      name: it.name,
      quantity: it.quantity,
      checked: false,
      notes: it.notes,
    })),
  };
}

/**
 * Default starter templates suggested to users on empty state
 */
export const STARTER_TEMPLATES: Array<{
  name: string;
  category: string;
  items: Array<{ name: string; quantity?: string }>;
}> = [
  {
    name: 'Weekly Groceries',
    category: 'Groceries',
    items: [
      { name: 'Eggs', quantity: '1 dozen' },
      { name: 'Milk', quantity: '1L' },
      { name: 'Bread', quantity: '1 loaf' },
      { name: 'Bananas', quantity: '1 bunch' },
      { name: 'Spinach / Greens', quantity: '1 bag' },
      { name: 'Chicken breast / Tofu', quantity: '500g' },
      { name: 'Olive oil', quantity: '1 bottle' },
    ],
  },
  {
    name: 'Weekend Trip Packing',
    category: 'Travel',
    items: [
      { name: 'Phone charger & cable', quantity: '1' },
      { name: 'Toothbrush & paste', quantity: '1 set' },
      { name: 'Clean shirts', quantity: '3' },
      { name: 'Extra socks', quantity: '3 pairs' },
      { name: 'Headphones / Earbuds', quantity: '1' },
      { name: 'ID card & wallet', quantity: '1' },
      { name: 'Water bottle', quantity: '1' },
    ],
  },
  {
    name: 'Pharmacy & Essentials',
    category: 'Health',
    items: [
      { name: 'Daily multivitamins', quantity: '1 bottle' },
      { name: 'Bandages', quantity: '1 box' },
      { name: 'Pain relief / Paracetamol', quantity: '1 strip' },
      { name: 'Hand sanitizer', quantity: '1' },
      { name: 'Electrolyte powder', quantity: '3 packets' },
    ],
  },
];
