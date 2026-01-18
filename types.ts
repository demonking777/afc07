
export type ItemType = 'veg' | 'non-veg';
export type ItemCategory = string; // Changed from fixed union to string to support dynamic categories

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ItemType;
  category: ItemCategory;
  isAvailable: boolean;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: number;
  platform: 'whatsapp' | 'web';
}

export interface Announcement {
  id: string;
  type: 'text' | 'image';
  content: string;
  isActive: boolean;
}

export interface PreviewVideo {
  id: string;
  url: string;
  poster?: string;
  isActive: boolean;
  createdAt: number;
}

export interface AdminUser {
  email: string;
  uid: string;
  isAnonymous: boolean;
}

// Analytics Types
export interface DailySales {
  date: string;
  amount: number;
  orders: number;
}

export interface AppSettings {
  whatsappNumber: string;
  categories: string[];
}
