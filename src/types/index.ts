export type UserRole = 'admin' | 'shopkeeper' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  shopId?: string;
  shopName?: string;
  avatar?: string;
  staffRoleId?: string;
}

export type AppModule = 'dashboard' | 'inventory' | 'billing' | 'customers' | 'bills' | 'staff' | 'roles' | 'settings' | 'subscription';
export type ModuleAction = 'view' | 'add' | 'edit' | 'delete';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  dashboard: ModulePermissions;
  inventory: ModulePermissions;
  billing: ModulePermissions;
  customers: ModulePermissions;
  bills: ModulePermissions;
  staff: ModulePermissions;
  roles: ModulePermissions;
  settings: ModulePermissions;
  subscription: ModulePermissions;
}

export const DEFAULT_MODULE_PERMISSIONS: ModulePermissions = { view: false, add: false, edit: false, delete: false };
export const ALL_MODULE_PERMISSIONS: ModulePermissions = { view: true, add: true, edit: true, delete: true };

export const ALL_MODULES: AppModule[] = ['dashboard', 'inventory', 'billing', 'customers', 'bills', 'staff', 'roles', 'settings', 'subscription'];
export const ALL_ACTIONS: ModuleAction[] = ['view', 'add', 'edit', 'delete'];

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
  email?: string;
  phone: string;
  role: string;
  roleId: string;
  active: boolean;
  joinedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: RolePermissions;
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
  duration: string;
  perMonthPrice: number;
  features: string[];
  recommended: boolean;
  savingsLabel?: string;
  tag?: string;
}

export type ShopStatus = 'active' | 'inactive' | 'suspended';
export type PlanName = 'Basic' | 'Standard' | 'Pro';

export interface Shop {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  plan: PlanName;
  status: ShopStatus;
  createdAt: string;
  address: string;
  revenue: number;
  staffCount: number;
}

export interface AdminStats {
  totalShops: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newShopsThisMonth: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: 'shop' | 'subscription' | 'alert' | 'payment';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type InviteStatus = 'pending' | 'accepted' | 'expired';

export interface ShopInvite {
  id: string;
  shopName: string;
  ownerEmail: string;
  plan: PlanName;
  token: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface StaffInvite {
  id: string;
  staffName: string;
  staffEmail: string;
  staffPhone: string;
  roleId: string;
  roleName: string;
  token: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}
