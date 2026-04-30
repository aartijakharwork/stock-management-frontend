import { useState, useMemo, useEffect } from 'react';
import {
  Package, PackageX, Plus, Minus, Trash2, Printer, Receipt, ShoppingCart, X,
  Banknote, Smartphone, CreditCard as CardIcon, Tag, MessageSquare,
  ChevronDown, Clock, Phone, User as UserIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { Toggle } from '../../components/ui/Toggle';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { inventoryItems, customers, bills as initialBills } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId, formatInvoiceNo, gstBreakdown } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import type { CartItem, InventoryItem, Bill, PaymentMethod } from '../../types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CardIcon },
];

export function ShopBilling() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [isUdhaar, setIsUdhaar] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [note, setNote] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const { addToast } = useToast();

  const categories = useMemo(
    () => Array.from(new Set(inventoryItems.map(i => i.category))).sort(),
    []
  );

  const customerOptions = useMemo(() => [
    { label: 'Walk-in customer', value: '' },
    ...customers.map(c => ({ label: `${c.name} (${c.phone})`, value: c.id })),
  ], []);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryItems.filter(i => {
      const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
      const matchesCat = !category || i.category === category;
      return matchesSearch && matchesCat;
    });
  }, [search, category]);

  const addToCart = (item: InventoryItem) => {
    if (item.stock === 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) { addToast('warning', 'Max stock reached'); return prev; }
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const maxQty = inventoryItems.find(i => i.id === id)?.stock || 0;
      const newQty = c.quantity + delta;
      if (newQty > maxQty) return c;
      return { ...c, quantity: newQty };
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const discountAmount = discountType === 'percent' ? Math.round((subtotal * discount) / 100) : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountOpen(false);
    setNote('');
    setNoteOpen(false);
    setBreakdownOpen(false);
  };

  const generateBill = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === customerId);
    const bill: Bill = {
      id: 'B' + generateId().toUpperCase().slice(0, 7),
      date: new Date().toISOString(),
      customerName: customer?.name || 'Walk-in',
      customerId: customer?.id,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod: isUdhaar ? undefined : paymentMethod,
      isUdhaar,
      paid: !isUdhaar,
      note: note.trim() || undefined,
    };
    setReceipt(bill);
    setMobileCartOpen(false);
    addToast('success', 'Bill generated', `${formatInvoiceNo(bill.id, bill.date)} · ${formatCurrency(bill.total)}`);
  };

  const startNewBill = () => {
    clearCart();
    setCustomerId('');
    setIsUdhaar(false);
    setPaymentMethod('cash');
    setReceipt(null);
  };

  const holdBill = () => {
    if (cart.length === 0) return;
    const ref = 'DRAFT-' + generateId().slice(0, 4).toUpperCase();
    addToast('info', 'Bill held as draft', `Ref ${ref} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatCurrency(total)}`);
    clearCart();
  };

  useEffect(() => {
    if (mobileCartOpen) {
      const o = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = o; };
    }
  }, [mobileCartOpen]);

  // Draft invoice number preview, derived from current bill count + 1
  const draftInvoice = useMemo(
    () => formatInvoiceNo(String(initialBills.length + 1).padStart(3, '0'), new Date().toISOString()),
    []
  );

  const cartProps = {
    cart, itemCount, subtotal, discountAmount, total, customerId,
    onCustomerChange: setCustomerId, customerOptions,
    selectedCustomer,
    isUdhaar, onUdhaarChange: setIsUdhaar,
    paymentMethod, onPaymentMethodChange: setPaymentMethod,
    discount, discountType,
    onDiscountChange: setDiscount, onDiscountTypeChange: setDiscountType,
    discountOpen, onDiscountOpenChange: setDiscountOpen,
    note, onNoteChange: setNote,
    noteOpen, onNoteOpenChange: setNoteOpen,
    breakdownOpen, onBreakdownOpenChange: setBreakdownOpen,
    onInc: (id: string) => updateQuantity(id, 1),
    onDec: (id: string) => updateQuantity(id, -1),
    onRemove: removeFromCart,
    onClear: clearCart,
    onHold: holdBill,
    onGenerate: generateBill,
    draftInvoice,
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
          <p className="text-xs text-gray-500">Tap items to add · cart on the right</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-[11px]">Open</Badge>
          <span className="hidden sm:inline-flex font-mono text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            Next · {draftInvoice}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT — item picker */}
        <section className="space-y-3 min-w-0">
          <Card padding={false}>
            <div className="p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Scan or search items by name or category…"
                    value={search}
                    onSearch={setSearch}
                    autoFocus
                  />
                </div>
                <div className="sm:w-44">
                  <Dropdown
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    options={[{ label: 'All categories', value: '' }, ...categories.map(c => ({ label: c, value: c }))]}
                  />
                </div>
              </div>
              {categories.length > 0 && (
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      category === ''
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        category === c
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {filteredItems.length === 0 ? (
            <Card>
              <EmptyState
                icon={<PackageX size={28} />}
                title="No items match your search"
                description="Check spelling or pick a different category."
                compact
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredItems.map(item => {
                const isOut = item.stock === 0;
                const isLow = item.stock > 0 && item.stock <= 5;
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    disabled={isOut}
                    className={`group relative flex flex-col gap-1.5 rounded-xl border bg-white dark:bg-gray-900 p-2.5 text-left transition-all ${
                      isOut
                        ? 'border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-sm cursor-pointer active:scale-[0.98]'
                    } ${inCart ? 'border-emerald-500 dark:border-emerald-500/60 ring-1 ring-emerald-200 dark:ring-emerald-500/20' : ''}`}
                  >
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums shadow-sm">
                        ×{inCart.quantity}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Package size={14} />
                      </div>
                      {isOut ? (
                        <Badge variant="danger">Out</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Low</Badge>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.category}</p>
                    </div>
                    <div className="flex items-baseline justify-between gap-1 mt-auto">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums text-sm">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {item.stock} {item.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT — sticky cart */}
        <aside className="hidden lg:block">
          <div className="sticky top-[88px]">
            <CartPane {...cartProps} />
          </div>
        </aside>
      </div>

      {/* Mobile cart trigger */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-30 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'} · {formatCurrency(total)}</p>
              {discountAmount > 0 && <p className="text-xs text-emerald-600">–{formatCurrency(discountAmount)} discount</p>}
            </div>
            <Button variant="primary" size="lg" icon={<ShoppingCart size={16} />} onClick={() => setMobileCartOpen(true)}>
              Review · {formatCurrency(total)}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile cart sheet */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:hidden">
          <div className="absolute inset-0" onClick={() => setMobileCartOpen(false)} />
          <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Bill</h2>
              <button onClick={() => setMobileCartOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
            </div>
            <div className="p-3">
              <CartPane {...cartProps} />
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal — thermal printer style preview */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Bill Receipt" size="md">
        {receipt && (() => {
          const tax = gstBreakdown(receipt.total);
          const itemCountTotal = receipt.items.reduce((s, it) => s + it.quantity, 0);
          return (
            <div className="space-y-4">
              {/* Thermal paper preview */}
              <div className="mx-auto bg-white text-gray-900 font-mono text-[12px] leading-tight max-w-[320px] shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                {/* top notch (printer tear) */}
                <div className="h-2 bg-[length:14px_8px] bg-[radial-gradient(circle_at_50%_100%,#fff_4px,#e5e7eb_5px)] dark:bg-[radial-gradient(circle_at_50%_100%,#fff_4px,#374151_5px)]" />

                <div className="px-4 py-3">
                  {/* Shop block */}
                  <div className="text-center">
                    <p className="text-[14px] font-bold tracking-wide uppercase">Kumar Auto Parts</p>
                    <p className="text-[10.5px]">123, Main Market, Karol Bagh</p>
                    <p className="text-[10.5px]">New Delhi · Ph 9876543200</p>
                    <p className="text-[10.5px]">GSTIN: 07ABCDE1234F1Z5</p>
                  </div>

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  <p className="text-center text-[11px] font-bold tracking-[0.18em] uppercase">Tax Invoice</p>

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  {/* Invoice meta */}
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>Inv No</span>
                      <span className="font-semibold">{formatInvoiceNo(receipt.id, receipt.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{formatDate(receipt.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer</span>
                      <span className="truncate max-w-[170px] text-right font-semibold">{receipt.customerName}</span>
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  {/* Item header */}
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex-1">Item</span>
                    <span className="w-10 text-right">Qty</span>
                    <span className="w-16 text-right">Price</span>
                    <span className="w-16 text-right">Amt</span>
                  </div>

                  <div className="my-1 border-t border-dashed border-gray-400" />

                  {/* Items */}
                  <ul className="space-y-1.5">
                    {receipt.items.map(it => (
                      <li key={it.id} className="text-[11px]">
                        <p className="truncate font-semibold">{it.name}</p>
                        <div className="flex justify-between tabular-nums">
                          <span className="flex-1 text-gray-500">&nbsp;</span>
                          <span className="w-10 text-right">{it.quantity}</span>
                          <span className="w-16 text-right">{it.price.toLocaleString('en-IN')}</span>
                          <span className="w-16 text-right">{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  {/* Totals */}
                  <div className="space-y-0.5 text-[11px] tabular-nums">
                    <div className="flex justify-between">
                      <span>Items</span><span>{itemCountTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{(receipt.subtotal || receipt.total).toLocaleString('en-IN')}</span>
                    </div>
                    {(receipt.discount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>− {receipt.discount!.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taxable</span><span>{tax.taxable.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST @ 9%</span><span>{tax.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @ 9%</span><span>{tax.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="my-2 border-t-2 border-double border-gray-700" />

                  <div className="flex justify-between font-bold text-[14px] tabular-nums">
                    <span>TOTAL</span>
                    <span>₹ {receipt.total.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-bold uppercase">
                        {receipt.isUdhaar ? '** UDHAAR / UNPAID **' : 'PAID'}
                      </span>
                    </div>
                    {receipt.paymentMethod && !receipt.isUdhaar && (
                      <div className="flex justify-between">
                        <span>Mode</span>
                        <span className="uppercase">{receipt.paymentMethod}</span>
                      </div>
                    )}
                  </div>

                  {receipt.note && (
                    <>
                      <div className="my-2 border-t border-dashed border-gray-400" />
                      <p className="text-[10.5px] italic">Note: {receipt.note}</p>
                    </>
                  )}

                  <div className="my-2 border-t border-dashed border-gray-400" />

                  <div className="text-center text-[10.5px] space-y-0.5">
                    <p className="font-semibold">~ Thank you, visit again ~</p>
                    <p className="text-[9.5px]">Goods once sold are not returnable</p>
                    <p className="text-[9.5px]">All disputes subject to Delhi jurisdiction</p>
                  </div>
                </div>

                {/* bottom notch */}
                <div className="h-2 bg-[length:14px_8px] bg-[radial-gradient(circle_at_50%_0%,#fff_4px,#e5e7eb_5px)] dark:bg-[radial-gradient(circle_at_50%_0%,#fff_4px,#374151_5px)]" />
              </div>

              {/* Status chip below preview */}
              <div className="flex justify-center">
                {receipt.isUdhaar
                  ? <Badge variant="warning">Saved as Udhaar — payment pending</Badge>
                  : <Badge variant="success">Marked Paid</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>
                <Button variant="primary" size="lg" icon={<Receipt size={16} />} onClick={startNewBill}>New Bill</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

interface CartPaneProps {
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  customerId: string;
  onCustomerChange: (v: string) => void;
  customerOptions: { label: string; value: string }[];
  selectedCustomer: { name: string; phone: string; pendingAmount: number } | undefined;
  isUdhaar: boolean;
  onUdhaarChange: (v: boolean) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (v: PaymentMethod) => void;
  discount: number;
  discountType: 'flat' | 'percent';
  onDiscountChange: (v: number) => void;
  onDiscountTypeChange: (v: 'flat' | 'percent') => void;
  discountOpen: boolean;
  onDiscountOpenChange: (v: boolean) => void;
  note: string;
  onNoteChange: (v: string) => void;
  noteOpen: boolean;
  onNoteOpenChange: (v: boolean) => void;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (v: boolean) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onHold: () => void;
  onGenerate: () => void;
  draftInvoice: string;
}

function CartPane({
  cart, itemCount, subtotal, discountAmount, total,
  customerId, onCustomerChange, customerOptions, selectedCustomer,
  isUdhaar, onUdhaarChange,
  paymentMethod, onPaymentMethodChange,
  discount, discountType, onDiscountChange, onDiscountTypeChange,
  discountOpen, onDiscountOpenChange,
  note, onNoteChange,
  noteOpen, onNoteOpenChange,
  breakdownOpen, onBreakdownOpenChange,
  onInc, onDec, onRemove, onClear, onHold, onGenerate,
  draftInvoice,
}: CartPaneProps) {
  const isEmpty = cart.length === 0;
  const tax = gstBreakdown(total);

  return (
    <Card padding={false} className="flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-gray-500">Current Bill</p>
          <p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 truncate">{draftInvoice}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 tabular-nums">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
          {!isEmpty && (
            <button onClick={onClear} className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
        <Dropdown
          options={customerOptions}
          value={customerId}
          onChange={e => onCustomerChange(e.target.value)}
        />
        {selectedCustomer && (
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <Phone size={11} className="text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{selectedCustomer.phone}</span>
            {selectedCustomer.pendingAmount > 0 && (
              <span className="ml-auto text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                Udhaar {formatCurrency(selectedCustomer.pendingAmount)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto min-h-[160px]">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mb-2">
              <ShoppingCart size={20} />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cart is empty</p>
            <p className="text-xs text-gray-500 mt-0.5">Tap an item on the left to start a bill.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {cart.map(item => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-500 tabular-nums">{formatCurrency(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onDec(item.id)}
                    className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    aria-label="Decrease"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onInc(item.id)}
                    className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    aria-label="Increase"
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <p className="w-16 text-right text-[12px] font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(item.price * item.quantity)}
                </p>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer (only when items present) */}
      {!isEmpty && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Add discount / note inline triggers */}
          <div className="px-4 py-2 flex flex-wrap items-center gap-2">
            {!discountOpen && discountAmount === 0 ? (
              <button
                onClick={() => onDiscountOpenChange(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Tag size={11} /> Add discount
              </button>
            ) : (
              <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Discount</span>
                  <div className="flex ml-auto gap-1">
                    {(['flat', 'percent'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => onDiscountTypeChange(t)}
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                          discountType === t ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t === 'flat' ? '₹' : '%'}
                      </button>
                    ))}
                    <button
                      onClick={() => { onDiscountChange(0); onDiscountOpenChange(false); }}
                      className="ml-1 px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  value={discount || ''}
                  onChange={e => onDiscountChange(Number(e.target.value))}
                  placeholder={discountType === 'flat' ? 'Amount in ₹' : 'Percentage'}
                />
                {discountAmount > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    −{formatCurrency(discountAmount)} off
                  </p>
                )}
              </div>
            )}
            {!noteOpen && !note ? (
              <button
                onClick={() => onNoteOpenChange(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <MessageSquare size={11} /> Add note
              </button>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                    <MessageSquare size={11} /> Note
                  </p>
                  <button
                    onClick={() => { onNoteChange(''); onNoteOpenChange(false); }}
                    className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={11} />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => onNoteChange(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Tax breakdown collapsible */}
          <button
            onClick={() => onBreakdownOpenChange(!breakdownOpen)}
            className="w-full px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-t border-gray-200 dark:border-gray-800"
          >
            <span>Tax breakdown · GST @ 18%</span>
            <ChevronDown size={11} className={`transition-transform ${breakdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {breakdownOpen && (
            <div className="px-4 pb-2 space-y-1 text-[11px] bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">Discount</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Taxable value</span>
                <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.taxable)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CGST @ 9%</span>
                <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.cgst)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">SGST @ 9%</span>
                <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.sgst)}</span>
              </div>
              <p className="text-[10px] text-gray-400 pt-1">Prices incl. GST · GSTIN 07ABCDE1234F1Z5</p>
            </div>
          )}

          {/* Udhaar toggle */}
          <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-900 dark:text-white">Save as Udhaar</p>
              <p className="text-[10px] text-gray-500">Mark as credit / unpaid</p>
            </div>
            <Toggle checked={isUdhaar} onChange={onUdhaarChange} />
          </div>

          {/* Payment method */}
          {!isUdhaar && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-1.5">Payment method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onPaymentMethodChange(value)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                      paymentMethod === value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticky CTA */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[11px] text-gray-500">{isUdhaar ? 'Udhaar amount' : 'Total payable'}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onGenerate}
                icon={isUdhaar ? <Clock size={16} /> : <Receipt size={16} />}
                className="w-full"
              >
                {isUdhaar ? 'Save Udhaar' : 'Charge & Print'}
              </Button>
              <Button variant="secondary" size="lg" onClick={onHold} icon={<UserIcon size={14} />}>
                Hold
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
