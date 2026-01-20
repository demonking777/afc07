
import { MenuItem } from './types';

export const APP_CONFIG = {
  name: 'Amma Food Center',
  currency: '₹',
  whatsappNumber: '919876543210', // Replace with real business number
  defaultCategories: ['Starter', 'Main Course', 'Breads', 'Rice', 'Dessert', 'Beverage'],
  // Get this from Google Cloud Console > APIs & Services > Credentials
  googleClientId: '' // Leave empty to disable/test safety check, or add your actual client ID
};

// ONLY used for local demo mode when Firebase is not configured
export const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@ammafood.com',
  password: 'admin'
};

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    description: 'Rich tomato gravy with tender chicken pieces',
    price: 320,
    type: 'non-veg',
    category: 'Main Course',
    isAvailable: true,
    image: 'https://picsum.photos/400/300?random=1'
  },
  {
    id: '2',
    name: 'Paneer Tikka Masala',
    description: 'Grilled paneer cubes in spicy gravy',
    price: 280,
    type: 'veg',
    category: 'Main Course',
    isAvailable: true,
    image: 'https://picsum.photos/400/300?random=2'
  },
  {
    id: '3',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with spices and chicken',
    price: 350,
    type: 'non-veg',
    category: 'Rice',
    isAvailable: true,
    image: 'https://picsum.photos/400/300?random=3'
  },
  {
    id: '4',
    name: 'Garlic Naan',
    description: 'Oven-baked flatbread topped with garlic',
    price: 60,
    type: 'veg',
    category: 'Breads',
    isAvailable: true,
    image: 'https://picsum.photos/400/300?random=4'
  },
  {
    id: '5',
    name: 'Gulab Jamun',
    description: 'Deep fried milk solids soaked in sugar syrup',
    price: 80,
    type: 'veg',
    category: 'Dessert',
    isAvailable: true,
    image: 'https://picsum.photos/400/300?random=5'
  },
  {
    id: '6',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato',
    price: 120,
    type: 'veg',
    category: 'Main Course',
    isAvailable: false, // Demo availability
    image: 'https://picsum.photos/400/300?random=6'
  }
];
