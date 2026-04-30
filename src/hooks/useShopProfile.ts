import { useEffect, useState, useCallback } from 'react';

export interface ShopProfile {
  name: string;
  phone: string;
  address: string;
  gstin: string;
  email: string;
  logoUrl?: string;
}

export interface InvoiceTemplate {
  prefix: string;       // e.g. INV
  startNumber: number;
  footerText: string;
  showGstin: boolean;
  showSignature: boolean;
  thermalSize: 'a4' | '80mm' | '58mm';
}

export interface NotificationPrefs {
  whatsappReminders: boolean;
  smsReminders: boolean;
  lowStockAlerts: boolean;
  dailySummary: boolean;
}

const KEY_PROFILE = 'shopmanager.shop.profile';
const KEY_INVOICE = 'shopmanager.shop.invoice';
const KEY_NOTIF = 'shopmanager.shop.notifications';

const DEFAULT_PROFILE: ShopProfile = {
  name: 'Kumar Auto Parts',
  phone: '9876543200',
  address: '123, Main Market, Karol Bagh, New Delhi',
  gstin: '07ABCDE1234F1Z5',
  email: 'shop@kumarauto.in',
};

const DEFAULT_INVOICE: InvoiceTemplate = {
  prefix: 'INV',
  startNumber: 1,
  footerText: 'Thank you for your business — visit again!',
  showGstin: true,
  showSignature: false,
  thermalSize: '80mm',
};

const DEFAULT_NOTIF: NotificationPrefs = {
  whatsappReminders: true,
  smsReminders: false,
  lowStockAlerts: true,
  dailySummary: true,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch { return fallback; }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent('storage', { key }));
}

export function useShopProfile() {
  const [profile, setProfile] = useState<ShopProfile>(() => read(KEY_PROFILE, DEFAULT_PROFILE));
  const [invoice, setInvoice] = useState<InvoiceTemplate>(() => read(KEY_INVOICE, DEFAULT_INVOICE));
  const [notif, setNotif] = useState<NotificationPrefs>(() => read(KEY_NOTIF, DEFAULT_NOTIF));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_PROFILE) setProfile(read(KEY_PROFILE, DEFAULT_PROFILE));
      if (e.key === KEY_INVOICE) setInvoice(read(KEY_INVOICE, DEFAULT_INVOICE));
      if (e.key === KEY_NOTIF) setNotif(read(KEY_NOTIF, DEFAULT_NOTIF));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateProfile = useCallback((p: Partial<ShopProfile>) => {
    const next = { ...profile, ...p };
    write(KEY_PROFILE, next);
    setProfile(next);
  }, [profile]);

  const updateInvoice = useCallback((i: Partial<InvoiceTemplate>) => {
    const next = { ...invoice, ...i };
    write(KEY_INVOICE, next);
    setInvoice(next);
  }, [invoice]);

  const updateNotif = useCallback((n: Partial<NotificationPrefs>) => {
    const next = { ...notif, ...n };
    write(KEY_NOTIF, next);
    setNotif(next);
  }, [notif]);

  return { profile, invoice, notif, updateProfile, updateInvoice, updateNotif };
}
