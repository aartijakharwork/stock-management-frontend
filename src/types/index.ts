export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
}

export interface CartItem extends InventoryItem {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  pendingAmount: number;
  address?: string;
}

export interface Bill {
  id: string;
  date: string;
  customerName: string;
  customerId?: string;
  items: CartItem[];
  total: number;
  isUdhaar: boolean;
  paid: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

export interface Permissions {
  inventory: boolean;
  billing: boolean;
  udhaar: boolean;
  reports: boolean;
  staff: boolean;
  settings: boolean;
}

export interface ShopDetails {
  name: string;
  address: string;
  phone: string;
  gst?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  recommended: boolean;
}
