export interface Category {
  id: string;
  label: string;
  href: string;
}

export const productCategories: Category[] = [
  {
    id: 'shampoo',
    label: 'Shampoo',
    href: '/categories/shampoo',
  },
  {
    id: 'conditioner',
    label: 'Conditioner',
    href: '/categories/conditioner',
  },
  {
    id: 'treatments',
    label: 'Treatments',
    href: '/categories/treatments',
  },
  {
    id: 'styling',
    label: 'Styling',
    href: '/categories/styling',
  },
  {
    id: 'kits-bundles',
    label: 'Kits & Bundles',
    href: '/categories/kits-bundles',
  },
];

