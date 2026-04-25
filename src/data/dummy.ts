import type {
  InventoryItem,
  Customer,
  Bill,
  StaffMember,
  Role,
  SubscriptionPlan,
} from '../types';

export const inventoryItems: InventoryItem[] = [
  { id: '1', name: 'Engine Oil 5W-30', price: 450, stock: 24, category: 'Oils', unit: 'bottle' },
  { id: '2', name: 'Brake Pad Set', price: 850, stock: 12, category: 'Brakes', unit: 'set' },
  { id: '3', name: 'Air Filter', price: 250, stock: 30, category: 'Filters', unit: 'piece' },
  { id: '4', name: 'Spark Plug (Iridium)', price: 320, stock: 50, category: 'Ignition', unit: 'piece' },
  { id: '5', name: 'Clutch Plate', price: 1200, stock: 8, category: 'Clutch', unit: 'piece' },
  { id: '6', name: 'Timing Belt', price: 680, stock: 15, category: 'Belts', unit: 'piece' },
  { id: '7', name: 'Headlight Bulb H4', price: 180, stock: 40, category: 'Electrical', unit: 'piece' },
  { id: '8', name: 'Battery 12V 65Ah', price: 4500, stock: 3, category: 'Electrical', unit: 'piece' },
  { id: '9', name: 'Coolant 1L', price: 220, stock: 18, category: 'Fluids', unit: 'bottle' },
  { id: '10', name: 'Wiper Blade 20"', price: 350, stock: 22, category: 'Accessories', unit: 'piece' },
  { id: '11', name: 'Oil Filter', price: 150, stock: 35, category: 'Filters', unit: 'piece' },
  { id: '12', name: 'Radiator Hose', price: 520, stock: 2, category: 'Cooling', unit: 'piece' },
  { id: '13', name: 'Alternator Belt', price: 380, stock: 10, category: 'Belts', unit: 'piece' },
  { id: '14', name: 'Fuel Filter', price: 190, stock: 28, category: 'Filters', unit: 'piece' },
  { id: '15', name: 'Wheel Bearing', price: 750, stock: 6, category: 'Suspension', unit: 'piece' },
];

export const customers: Customer[] = [
  { id: '1', name: 'Rajesh Kumar', phone: '9876543210', pendingAmount: 2500 },
  { id: '2', name: 'Sunil Sharma', phone: '9876543211', pendingAmount: 0 },
  { id: '3', name: 'Amit Patel', phone: '9876543212', pendingAmount: 1200 },
  { id: '4', name: 'Vikram Singh', phone: '9876543213', pendingAmount: 4800 },
  { id: '5', name: 'Manoj Gupta', phone: '9876543214', pendingAmount: 350 },
  { id: '6', name: 'Deepak Verma', phone: '9876543215', pendingAmount: 0 },
  { id: '7', name: 'Sanjay Yadav', phone: '9876543216', pendingAmount: 1800 },
  { id: '8', name: 'Ravi Tiwari', phone: '9876543217', pendingAmount: 0 },
];

export const bills: Bill[] = [
  {
    id: 'B001',
    date: '2026-04-25',
    customerName: 'Rajesh Kumar',
    customerId: '1',
    items: [
      { ...inventoryItems[0], quantity: 2 },
      { ...inventoryItems[2], quantity: 1 },
    ],
    total: 1150,
    isUdhaar: true,
    paid: false,
  },
  {
    id: 'B002',
    date: '2026-04-25',
    customerName: 'Walk-in',
    items: [
      { ...inventoryItems[3], quantity: 4 },
    ],
    total: 1280,
    isUdhaar: false,
    paid: true,
  },
  {
    id: 'B003',
    date: '2026-04-24',
    customerName: 'Amit Patel',
    customerId: '3',
    items: [
      { ...inventoryItems[1], quantity: 1 },
      { ...inventoryItems[5], quantity: 1 },
    ],
    total: 1530,
    isUdhaar: false,
    paid: true,
  },
  {
    id: 'B004',
    date: '2026-04-24',
    customerName: 'Vikram Singh',
    customerId: '4',
    items: [
      { ...inventoryItems[7], quantity: 1 },
    ],
    total: 4500,
    isUdhaar: true,
    paid: false,
  },
  {
    id: 'B005',
    date: '2026-04-23',
    customerName: 'Walk-in',
    items: [
      { ...inventoryItems[6], quantity: 2 },
      { ...inventoryItems[9], quantity: 1 },
    ],
    total: 710,
    isUdhaar: false,
    paid: true,
  },
  {
    id: 'B006',
    date: '2026-04-23',
    customerName: 'Manoj Gupta',
    customerId: '5',
    items: [
      { ...inventoryItems[10], quantity: 1 },
      { ...inventoryItems[8], quantity: 2 },
    ],
    total: 590,
    isUdhaar: true,
    paid: false,
  },
];

export const staffMembers: StaffMember[] = [
  { id: '1', name: 'Rahul Mehta', phone: '9876543220', role: 'Manager', active: true },
  { id: '2', name: 'Priya Sharma', phone: '9876543221', role: 'Cashier', active: true },
  { id: '3', name: 'Karan Singh', phone: '9876543222', role: 'Inventory Staff', active: true },
  { id: '4', name: 'Neha Gupta', phone: '9876543223', role: 'Cashier', active: false },
];

export const roles: Role[] = [
  {
    id: '1',
    name: 'Manager',
    permissions: { inventory: true, billing: true, udhaar: true, reports: true, staff: true, settings: true },
  },
  {
    id: '2',
    name: 'Cashier',
    permissions: { inventory: false, billing: true, udhaar: true, reports: false, staff: false, settings: false },
  },
  {
    id: '3',
    name: 'Inventory Staff',
    permissions: { inventory: true, billing: false, udhaar: false, reports: false, staff: false, settings: false },
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Basic',
    price: 299,
    period: 'month',
    features: ['Up to 100 items', '1 staff account', 'Basic billing', 'Email support'],
    recommended: false,
  },
  {
    id: '2',
    name: 'Standard',
    price: 599,
    period: 'month',
    features: ['Up to 500 items', '3 staff accounts', 'Full billing + Udhaar', 'Bill printing', 'Priority support'],
    recommended: true,
  },
  {
    id: '3',
    name: 'Pro',
    price: 999,
    period: 'month',
    features: ['Unlimited items', 'Unlimited staff', 'All features', 'Reports & analytics', 'Dedicated support', 'Multi-shop'],
    recommended: false,
  },
];
