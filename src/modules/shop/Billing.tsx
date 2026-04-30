import { useState, useMemo, useEffect } from 'react';
import {
  Package, Plus, Minus, Trash2, Printer, Receipt, ShoppingCart, X,
  Banknote, Smartphone, CreditCard as CardIcon, Tag, MessageSquare,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { Toggle } from '../../components/ui/Toggle';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { inventoryItems, customers } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId } from '../../utils/formatters';
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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const { addToast } = useToast();

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(i => i.category))).sort();
    return [{ label: 'All', value: '' }, ...cats.map(c => ({ label: c, value: c }))];
  }, []);

  const customerOptions = useMemo(() => [
    { label: 'Walk-in customer', value: '' },
    ...customers.map(c => ({ label: `${c.name} (${c.phone})`, value: c.id })),
  ], []);

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
    addToast('success', 'Bill generated', `Bill #${bill.id} · ${formatCurrency(bill.total)}`);
  };

  const startNewBill = () => {
    setCart([]);
    setCustomerId('');
    setIsUdhaar(false);
    setPaymentMethod('cash');
    setDiscount(0);
    setNote('');
    setReceipt(null);
  };

  useEffect(() => {
    if (mobileCartOpen) {
      const o = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = o; };
    }
  }, [mobileCartOpen]);

  const cartProps = {
    cart, itemCount, subtotal, discountAmount, total, customerId,
    onCustomerChange: setCustomerId, customerOptions,
    isUdhaar, onUdhaarChange: setIsUdhaar,
    paymentMethod, onPaymentMethodChange: setPaymentMethod,
    discount, discountType,
    onDiscountChange: setDiscount, onDiscountTypeChange: setDiscountType,
    note, onNoteChange: setNote,
    onInc: (id: string) => updateQuantity(id, 1),
    onDec: (id: string) => updateQuantity(id, -1),
    onRemove: removeFromCart,
    onGenerate: generateBill,
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Bill</h1>
        <p className="mt-1 text-sm text-gray-500">Point of sale — select items and generate bills.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="space-y-4">
          <Card padding={false}>
            <div className="p-3 sm:p-4">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {categoryOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      category === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <SearchInput placeholder="Search items..." value={search} onSearch={setSearch} />
            </div>
          </Card>

          {filteredItems.length === 0 ? (
            <Card><p className="text-center text-sm text-gray-500 py-8">No items match your search.</p></Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
                    className={`group relative flex flex-col gap-2 rounded-xl border bg-white dark:bg-gray-900 p-3 text-left transition-all ${
                      isOut ? 'border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed' : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-sm cursor-pointer'
                    } ${inCart ? 'border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-100 dark:ring-emerald-500/10' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Package size={18} />
                      </div>
                      {inCart && (
                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          ×{inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums text-sm">{formatCurrency(item.price)}</span>
                      {isOut ? (
                        <Badge variant="danger">Out</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Low: {item.stock}</Badge>
                      ) : (
                        <span className="text-[11px] text-gray-400 tabular-nums">{item.stock}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

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
            <Button variant="primary" size="lg" icon={<ShoppingCart size={16} />} onClick={() => setMobileCartOpen(true)}>Cart ({itemCount})</Button>
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
            <div className="p-5">
              <CartPane {...cartProps} />
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Bill Receipt" size="md">
        {receipt && (
          <div className="space-y-5">
            {/* Shop header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-base font-bold text-gray-900 dark:text-white">Kumar Auto Parts</p>
              <p className="text-xs text-gray-500">123, Main Market, Karol Bagh, New Delhi</p>
              <p className="text-xs text-gray-500">Ph: 9876543200</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-gray-500">Bill No.</p><p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{receipt.id}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">Date</p><p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(receipt.date)}</p></div>
              </div>
              <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{receipt.customerName}</p>
              </div>
              <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Items</p>
                {receipt.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="text-gray-900 dark:text-white">{it.name}</p>
                      <p className="text-xs text-gray-500 tabular-nums">{it.quantity} × {formatCurrency(it.price)}</p>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 tabular-nums font-medium">{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(receipt.subtotal || receipt.total)}</span>
                </div>
                {(receipt.discount ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Discount</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">–{formatCurrency(receipt.discount!)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 border-t-2 border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(receipt.total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                {receipt.isUdhaar ? <Badge variant="warning">Pending Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
              </div>
              {receipt.paymentMethod && !receipt.isUdhaar && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Payment</span>
                  <Badge variant="neutral" className="capitalize">{receipt.paymentMethod}</Badge>
                </div>
              )}
              {receipt.note && (
                <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-xs text-gray-500">Note</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{receipt.note}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" size="lg" icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>
              <Button variant="primary" size="lg" icon={<Receipt size={16} />} onClick={startNewBill}>New Bill</Button>
            </div>
          </div>
        )}
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
  isUdhaar: boolean;
  onUdhaarChange: (v: boolean) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (v: PaymentMethod) => void;
  discount: number;
  discountType: 'flat' | 'percent';
  onDiscountChange: (v: number) => void;
  onDiscountTypeChange: (v: 'flat' | 'percent') => void;
  note: string;
  onNoteChange: (v: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onGenerate: () => void;
}

function CartPane({
  cart, itemCount, subtotal, discountAmount, total,
  customerId, onCustomerChange, customerOptions,
  isUdhaar, onUdhaarChange,
  paymentMethod, onPaymentMethodChange,
  discount, discountType, onDiscountChange, onDiscountTypeChange,
  note, onNoteChange,
  onInc, onDec, onRemove, onGenerate,
}: CartPaneProps) {
  return (
    <Card padding={false}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Current Bill</h2>
          <p className="text-xs text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <ShoppingCart size={16} />
        </div>
      </div>

      {/* Customer */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <Dropdown label="Customer" options={customerOptions} value={customerId} onChange={e => onCustomerChange(e.target.value)} />
      </div>

      {/* Cart Items */}
      <div className="max-h-[36vh] overflow-y-auto lg:max-h-[38vh]">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <ShoppingCart size={26} />
            <p className="text-sm">No items added yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {cart.map(item => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-500 tabular-nums">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onDec(item.id)} className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"><Minus size={12} /></button>
                  <span className="w-7 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{item.quantity}</span>
                  <button onClick={() => onInc(item.id)} className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"><Plus size={12} /></button>
                </div>
                <p className="w-16 text-right text-xs font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2.5">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={13} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Discount</span>
            <div className="flex ml-auto gap-1">
              {(['flat', 'percent'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onDiscountTypeChange(t)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${discountType === t ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {t === 'flat' ? '₹' : '%'}
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            value={discount || ''}
            onChange={e => onDiscountChange(Number(e.target.value))}
            placeholder={discountType === 'flat' ? 'Amount in ₹' : 'Percentage'}
          />
          {discountAmount > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">–{formatCurrency(discountAmount)} off</p>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(total)}</span>
        </div>

        {/* Udhaar toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
          <div>
            <p className="text-sm text-gray-900 dark:text-white">Save as Udhaar</p>
            <p className="text-xs text-gray-500">Mark as credit / unpaid</p>
          </div>
          <Toggle checked={isUdhaar} onChange={onUdhaarChange} />
        </div>

        {/* Payment method (only if not udhaar) */}
        {!isUdhaar && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Payment method</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPaymentMethodChange(value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    paymentMethod === value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare size={12} className="text-gray-400" />
            <p className="text-xs font-medium text-gray-500">Note (optional)</p>
          </div>
          <textarea
            rows={2}
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Add a note..."
            className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        <Button variant="primary" size="lg" onClick={onGenerate} disabled={cart.length === 0} icon={<Receipt size={16} />} className="w-full">
          Generate Bill
        </Button>
      </div>
    </Card>
  );
}
