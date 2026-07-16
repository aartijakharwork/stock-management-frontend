import type {
  InventoryItem,
  Customer,
  Bill,
  StaffMember,
  Role,
  SubscriptionPlan,
} from '../types';

/** Legacy demo page — inventory is empty; use the main shop app for real data. */
export const inventoryItems: InventoryItem[] = [];

export const customers: Customer[] = [
  { id: '1', name: 'Rajesh Kumar', phone: '7877965097', pendingAmount: 2500 },
  { id: '2', name: 'Sunil Sharma', phone: '9876543211', pendingAmount: 0 },
  { id: '3', name: 'Amit Patel', phone: '9876543212', pendingAmount: 1200 },
  { id: '4', name: 'Vikram Singh', phone: '9876543213', pendingAmount: 4800 },
  { id: '5', name: 'Manoj Gupta', phone: '9876543214', pendingAmount: 350 },
  { id: '6', name: 'Deepak Verma', phone: '9876543215', pendingAmount: 0 },
  { id: '7', name: 'Sanjay Yadav', phone: '9876543216', pendingAmount: 1800 },
  { id: '8', name: 'Ravi Tiwari', phone: '9876543217', pendingAmount: 0 },
];

export const bills: Bill[] = [];

export const staffMembers: StaffMember[] = [
  { id: '1', name: 'Rahul Mehta', phone: '9876543220', role: 'Manager', roleId: '1', active: true },
  { id: '2', name: 'Priya Sharma', phone: '9876543221', role: 'Cashier', roleId: '2', active: true },
  { id: '3', name: 'Karan Singh', phone: '9876543222', role: 'Inventory Staff', roleId: '3', active: true },
  { id: '4', name: 'Neha Gupta', phone: '9876543223', role: 'Cashier', roleId: '2', active: false },
];

export const roles: Role[] = [
  {
    id: '1',
    name: 'Manager',
    permissions: {
      dashboard: { view: true, add: true, edit: true, delete: true },
      inventory: { view: true, add: true, edit: true, delete: true },
      billing: { view: true, add: true, edit: true, delete: true },
      customers: { view: true, add: true, edit: true, delete: true },
      staff: { view: true, add: true, edit: true, delete: true },
      roles: { view: true, add: false, edit: false, delete: false },
      settings: { view: true, add: true, edit: true, delete: false },
    },
  },
  {
    id: '2',
    name: 'Cashier',
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false },
      inventory: { view: true, add: false, edit: false, delete: false },
      billing: { view: true, add: true, edit: true, delete: false },
      customers: { view: true, add: true, edit: false, delete: false },
      staff: { view: false, add: false, edit: false, delete: false },
      roles: { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
    },
  },
  {
    id: '3',
    name: 'Inventory Staff',
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false },
      inventory: { view: true, add: true, edit: true, delete: false },
      billing: { view: false, add: false, edit: false, delete: false },
      customers: { view: false, add: false, edit: false, delete: false },
      staff: { view: false, add: false, edit: false, delete: false },
      roles: { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
    },
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Basic',
    price: 299,
    period: 'month',
    duration: '1 month',
    perMonthPrice: 299,
    features: ['Up to 100 items', '1 staff account', 'Basic billing', 'Email support'],
    recommended: false,
  },
  {
    id: '2',
    name: 'Standard',
    price: 599,
    period: 'month',
    duration: '1 month',
    perMonthPrice: 599,
    features: ['Up to 500 items', '3 staff accounts', 'Full billing + Udhaar', 'Bill printing', 'Priority support'],
    recommended: true,
  },
  {
    id: '3',
    name: 'Pro',
    price: 999,
    period: 'month',
    duration: '1 month',
    perMonthPrice: 999,
    features: ['Unlimited items', 'Unlimited staff', 'All features', 'Reports & analytics', 'Dedicated support', 'Multi-shop'],
    recommended: false,
  },
];
