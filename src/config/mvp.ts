// MVP-mode configuration.
//
// Phase-1 MVP focuses on the kirana shopkeeper's core diary loop:
//   Purchase → Stock → Sale → Udhaar → Tracking
//
// Anything outside that loop is *hidden* (not deleted) when MVP_MODE is true.
// All underlying components, routes, permissions, and logic still exist —
// flipping MVP_MODE to false instantly restores the full product surface.
//
// This single source of truth is consumed by:
//   - ShopSidebar       (filters nav items)
//   - BottomNav         (filters mobile tabs)
//   - MobileFAB         (collapses quick-actions)
//   - App routes        (redirects hidden routes to /shop)
//   - Settings          (filters tabs)
//   - ShopLayout        (gates WhatsNewModal / CommandPalette / Shortcuts)
//
// To unhide a module for a power user, just set MVP_MODE = false.

import type { AppModule } from '../types';

export const MVP_MODE = true;

// Modules that *stay visible* in the MVP. Everything else is hidden from
// navigation. Logic, routes, and components for hidden modules are untouched.
export const MVP_VISIBLE_MODULES: AppModule[] = [
  'dashboard',
  'catalogue',
  'billing',
  'inventory',
  'customers',
  'bills',
  'settings',
];

export function isModuleVisible(m: AppModule): boolean {
  if (!MVP_MODE) return true;
  return MVP_VISIBLE_MODULES.includes(m);
}

// Hidden top-level paths (used by route guard to redirect to dashboard).
// Auth routes (/auth/*) are never listed here. Staff, roles, reports, and
// settings stay reachable in MVP.
export const MVP_HIDDEN_PATHS: string[] = [
  '/shop/expenses',
  '/shop/suppliers',
  '/shop/subscription',
  '/shop/staff',
  '/shop/roles',
  '/shop/reports',
];

export function isPathHidden(path: string): boolean {
  if (!MVP_MODE) return false;
  return MVP_HIDDEN_PATHS.some(p => path === p || path.startsWith(p + '/'));
}

// Settings: Phase 1 shows shop identity, bill look & feel, product categories, and backup.
// Tax, numbering, notifications, integrations, and danger zone stay in code
// but are hidden from the tab strip until MVP_MODE is false.
export const MVP_VISIBLE_SETTINGS_TABS = ['profile', 'template', 'categories', 'backup'] as const;

// Cross-cutting "power-user" surfaces hidden in MVP mode.
export const MVP_HIDE_COMMAND_PALETTE = true;
export const MVP_HIDE_SHORTCUTS_OVERLAY = true;
export const MVP_HIDE_WHATSNEW_MODAL = true;
