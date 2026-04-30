export type UserRole = 'admin' | 'shopkeeper' | 'staff';
export type PaymentMethod = 'cash' | 'card' | 'upi';
export type CustomerTag = 'wholesale' | 'retail' | 'vip';

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

export type AppModule = 'dashboard' | 'inventory' | 'billing' | 'customers' | 'bills' | 'staff' | 'roles' | 'settings' | 'subscription' | 'expenses' | 'suppliers';
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
  expenses?: ModulePermissions;
  suppliers?: ModulePermissions;
}

export const DEFAULT_MODULE_PERMISSIONS: ModulePermissions = { view: false, add: false, edit: false, delete: false };
export const ALL_MODULE_PERMISSIONS: ModulePermissions = { view: true, add: true, edit: true, delete: true };

export const ALL_MODULES: AppModule[] = ['dashboard', 'inventory', 'billing', 'customers', 'bills', 'staff', 'roles', 'settings', 'subscription', 'expenses', 'suppliers'];
export const ALL_ACTIONS: ModuleAction[] = ['view', 'add', 'edit', 'delete'];

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  // Phase 2 extensions — all optional so legacy data keeps working
  costPrice?: number;
  sku?: string;
  barcode?: string;
  reorderLevel?: number;
  supplierId?: string;
  hsn?: string;
  taxRate?: number; // percent, defaults to 18
  expiryDate?: string; // ISO
  batchNo?: string;
  imageUrl?: string;
  lastSoldAt?: string; // ISO — derived but cached for performance
}

export interface CartItem extends InventoryItem {
  quantity: number;
  lineDiscount?: number; // flat ₹ off this line
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  pendingAmount: number;
  address?: string;
  // Phase 2 extensions
  gstin?: string;
  creditLimit?: number;
  tags?: CustomerTag[];
  birthday?: string;       // MM-DD or full ISO
  anniversary?: string;
  area?: string;
  pincode?: string;
  lastReminderAt?: string; // ISO
  email?: string;
}

export interface SplitTender {
  method: PaymentMethod | 'udhaar';
  amount: number;
}

export interface Bill {
  id: string;
  date: string;
  customerName: string;
  customerId?: string;
  items: CartItem[];
  subtotal?: number;
  discount?: number;
  total: number;
  paymentMethod?: PaymentMethod;
  isUdhaar: boolean;
  paid: boolean;
  note?: string;
  // Phase 2 extensions
  splitTenders?: SplitTender[];
  roundOff?: number;
  returnedAgainst?: string; // bill ID this is a return for (credit note)
  isReturn?: boolean;
  createdBy?: string;
  editedBy?: string;
  editedAt?: string;
}

export interface HeldBill {
  ref: string; // DRAFT-XXXX
  createdAt: string;
  customerId?: string;
  customerName: string;
  items: CartItem[];
  total: number;
  note?: string;
}

export type LedgerEntryKind = 'bill' | 'payment' | 'adjustment' | 'return';

export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;
  kind: LedgerEntryKind;
  description: string;
  debit: number;   // amount they owe (bill total)
  credit: number;  // amount paid (payment received)
  refId?: string;  // bill / return reference
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  payableBalance: number;
  lastOrderDate?: string;
  notes?: string;
}

export type ActivityKind = 'created' | 'edited' | 'paid' | 'returned' | 'deleted' | 'reminder' | 'note';

export interface ActivityEntry {
  id: string;
  refKind: 'bill' | 'customer' | 'item';
  refId: string;
  kind: ActivityKind;
  message: string;
  actor: string; // staff name
  at: string;    // ISO
}

export type ExpenseCategory = 'Rent' | 'Salaries' | 'Utilities' | 'Inventory' | 'Marketing' | 'Maintenance' | 'Supplies' | 'Misc';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string;
  vendor?: string;
  recurring?: boolean;
  receiptUrl?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

export type PurchaseStatus = 'draft' | 'placed' | 'received' | 'cancelled';

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  supplierId?: string;
  items: PurchaseItem[];
  total: number;
  paid: boolean;
  status?: PurchaseStatus;
  expectedDate?: string;
  notes?: string;
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
