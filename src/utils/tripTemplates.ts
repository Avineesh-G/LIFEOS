import type { PackingGroup, TripCategory, TripPackingItem } from '../types';

export interface TripTemplatePreset {
  id: string;
  label: string;
  category: TripCategory;
  items: { name: string; group: PackingGroup; quantity?: string }[];
}

export const TRIP_STARTER_TEMPLATES: TripTemplatePreset[] = [
  {
    id: 'hostel_return',
    label: 'Hostel Return',
    category: 'hostel',
    items: [
      { name: 'College / Hostel ID Card', group: 'documents' },
      { name: 'Room & Locker Keys', group: 'documents' },
      { name: 'Laptop & Charger', group: 'tech' },
      { name: 'Phone Charger & Earphones', group: 'tech' },
      { name: 'Extension Cord / Spike Guard', group: 'tech' },
      { name: 'Daily Outfits & Gym Wear', group: 'clothing', quantity: '5 sets' },
      { name: 'Toiletries & Towel', group: 'essentials' },
      { name: 'Basic Medicines & Water Bottle', group: 'essentials' },
    ],
  },
  {
    id: 'home_break',
    label: 'Home Break',
    category: 'home',
    items: [
      { name: 'Travel Ticket / Student ID', group: 'documents' },
      { name: 'Laptop, Phone & Chargers', group: 'tech' },
      { name: 'Earbuds & Power Bank', group: 'tech' },
      { name: 'Gifts or Items for Family', group: 'essentials' },
      { name: 'Laundry & Casual Wear', group: 'clothing' },
    ],
  },
  {
    id: 'hackathon',
    label: 'Hackathon / Tech',
    category: 'hackathon',
    items: [
      { name: 'College / Gov ID Proof', group: 'documents' },
      { name: 'Laptop & High-Watt Charger', group: 'tech' },
      { name: 'USB-C Hub & Ethernet/Adapter', group: 'tech' },
      { name: 'Power Bank & Cables', group: 'tech' },
      { name: 'Hoodie / Extra T-Shirt', group: 'clothing' },
      { name: 'Deodorant, Mints & Water Bottle', group: 'essentials' },
    ],
  },
  {
    id: 'weekend_trip',
    label: 'Weekend Trip',
    category: 'weekend',
    items: [
      { name: 'Gov ID / Driving License', group: 'documents' },
      { name: 'Power Bank & Charging Cable', group: 'tech' },
      { name: 'Outfits & Comfortable Footwear', group: 'clothing' },
      { name: 'Light Jacket / Sunglasses', group: 'clothing' },
      { name: 'Toiletry Pouch & Sunscreen', group: 'essentials' },
      { name: 'Emergency Cash & Meds', group: 'essentials' },
    ],
  },
];

export function buildPackingItemsFromTemplate(templateId: string): TripPackingItem[] {
  const tpl = TRIP_STARTER_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return [];
  const now = Date.now();
  return tpl.items.map((item, idx) => ({
    id: `pack_${now}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    name: item.name,
    group: item.group,
    packed: false,
    quantity: item.quantity,
  }));
}

