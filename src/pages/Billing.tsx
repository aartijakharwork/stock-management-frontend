import { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  Trash2,
  Printer,
  Receipt,
  ShoppingCart,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Card } from '../components/ui/Card';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { inventoryItems, customers } from '../data/dummy';
import { formatCurrency, formatDate, generateId } from '../utils/formatters';
import type { CartItem, InventoryItem, Bill } from '../types';

const LOW_STOCK_THRESHOLD = 5;

export function Billing() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [isUdhaar, setIsUdhaar] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(i => i.category))).sort();
    return [
      { label: 'All categories', value: '' },
      ...cats.map(c => ({ label: c, value: c })),
    ];
  }, []);

  const customerOptions = useMemo(() => {
    return [
      { label: 'Walk-in customer', value: '' },
      ...customers.map(c => ({ label: `${c.name} (${c.phone})`, value: c.id })),
    ];
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryItems.filter(i => {
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchesCat = !category || i.category === category;
      return matchesSearch && matchesCat;
    });
  }, [search, category]);

  const addToCart = (item: InventoryItem) => {
    if (item.stock === 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => {
          if (c.id !== id) return c;
          const maxQty = inventoryItems.find(i => i.id === id)?.stock || 0;
          const newQty = c.quantity + delta;
          if (newQty > maxQty) return c;
          return { ...c, quantity: newQty };
        })
        .filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    if (!confirm('Remove this item from the bill?')) return;
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const generateBill = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === customerId);
    const bill: Bill = {
      id: generateId().toUpperCase().slice(0, 8),
      date: new Date().toISOString(),
      customerName: customer?.name || 'Walk-in',
      customerId: customer?.id,
      items: cart,
      total,
      isUdhaar,
      paid: !isUdhaar,
    };
    setReceipt(bill);
    setMobileCartOpen(false);
  };

  const startNewBill = () => {
    setCart([]);
    setCustomerId('');
    setIsUdhaar(false);
    setReceipt(null);
  };

  // Lock background when mobile cart open
  useEffect(() => {
    if (mobileCartOpen) {
      const o = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = o;
      };
    }
  }, [mobileCartOpen]);

  const cartContent = (
    <CartPane
      cart={cart}
      itemCount={itemCount}
      total={total}
      customerId={customerId}
      onCustomerChange={setCustomerId}
      customerOptions={customerOptions}
      isUdhaar={isUdhaar}
      onUdhaarChange={setIsUdhaar}
      onInc={id => updateQuantity(id, 1)}
      onDec={id => updateQuantity(id, -1)}
      onRemove={removeFromCart}
      onGenerate={generateBill}
    />
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
          Point of sale
        </p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">New Bill</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left pane — item picker */}
        <section className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <SearchInput
                placeholder="Search items by name or category..."
                value={search}
                onSearch={setSearch}
              />
              <Dropdown
                options={categoryOptions}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
          </Card>

          {filteredItems.length === 0 ? (
            <Card>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
                No items match your search.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map(item => {
                const isLow = item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD;
                const isOut = item.stock === 0;
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    disabled={isOut}
                    className={`group relative flex min-h-[44px] flex-col gap-2 rounded-xl border bg-white dark:bg-white/5 backdrop-blur-sm p-3 text-left transition-colors ${
                      isOut
                        ? 'border-gray-200 dark:border-white/10 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 cursor-pointer'
                    } ${inCart ? 'border-cyan-300 dark:border-cyan-400/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 dark:from-purple-500/20 to-cyan-100 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                        <Package size={18} />
                      </div>
                      {inCart && (
                        <span className="rounded-full border border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 tabular-nums">
                          x{inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-1">
                        {item.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-cyan-700 dark:text-cyan-300 font-semibold tabular-nums text-sm">
                        {formatCurrency(item.price)}
                      </span>
                      {isOut ? (
                        <Badge variant="danger">Out</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Low: {item.stock}</Badge>
                      ) : (
                        <span className="text-[11px] text-gray-500 tabular-nums">
                          {item.stock} {item.unit}
                        </span>
                      )}
                    </div>
                    <span className="pointer-events-none absolute inset-x-3 bottom-2 text-[11px] text-gray-500 opacity-0 group-hover:opacity-0">
                      Tap to add
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right pane — cart on lg+ */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">{cartContent}</div>
        </aside>
      </div>

      {/* Mobile sticky bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 dark:border-white/5 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                Current bill
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                <span className="text-gray-900 dark:text-white font-semibold">
                  {formatCurrency(total)}
                </span>
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={<ShoppingCart size={16} />}
              onClick={() => setMobileCartOpen(true)}
            >
              Open cart
            </Button>
          </div>
        </div>
      )}

      {/* Mobile cart modal */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm lg:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b0b0d]">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Bill</h2>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{cartContent}</div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title="Bill Receipt"
        size="md"
      >
        {receipt && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    Bill ID
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{receipt.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    Date
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(receipt.date)}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 dark:border-white/5 pt-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  Customer
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{receipt.customerName}</p>
              </div>
              <div className="mt-4 border-t border-gray-200 dark:border-white/5 pt-3 space-y-2">
                {receipt.items.map(it => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-white truncate">{it.name}</p>
                      <p className="text-xs text-gray-500 tabular-nums">
                        {it.quantity} × {formatCurrency(it.price)}
                      </p>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 tabular-nums">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-gray-200 dark:border-white/5 pt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(receipt.total)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                {receipt.isUdhaar ? (
                  <Badge variant="warning">Pending Udhaar</Badge>
                ) : (
                  <Badge variant="success">Paid</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                icon={<Printer size={16} />}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={<Receipt size={16} />}
                onClick={startNewBill}
              >
                New Bill
              </Button>
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
  total: number;
  customerId: string;
  onCustomerChange: (v: string) => void;
  customerOptions: { label: string; value: string }[];
  isUdhaar: boolean;
  onUdhaarChange: (v: boolean) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onGenerate: () => void;
}

function CartPane({
  cart,
  itemCount,
  total,
  customerId,
  onCustomerChange,
  customerOptions,
  isUdhaar,
  onUdhaarChange,
  onInc,
  onDec,
  onRemove,
  onGenerate,
}: CartPaneProps) {
  return (
    <Card padding={false}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Bill</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-0.5">
            Items: <span className="tabular-nums text-gray-600 dark:text-gray-400">{itemCount}</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 dark:from-purple-500/20 to-cyan-100 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300">
          <ShoppingCart size={18} />
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1.5">
          Customer
        </p>
        <Dropdown
          options={customerOptions}
          value={customerId}
          onChange={e => onCustomerChange(e.target.value)}
        />
      </div>

      <div className="max-h-[40vh] overflow-y-auto lg:max-h-[44vh]">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
            <ShoppingCart size={28} strokeWidth={1.5} />
            <p className="text-sm">No items yet. Tap an item to add.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-white/5">
            {cart.map(item => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 tabular-nums">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDec(item.id)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInc(item.id)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <p className="w-20 text-right text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(item.price * item.quantity)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-white/5 px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2">
          <div>
            <p className="text-sm text-gray-900 dark:text-white">Save as Udhaar</p>
            <p className="text-xs text-gray-500">Mark this bill as unpaid</p>
          </div>
          <Toggle checked={isUdhaar} onChange={onUdhaarChange} />
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={cart.length === 0}
          icon={<Receipt size={16} />}
          className="w-full"
        >
          Generate Bill
        </Button>
      </div>
    </Card>
  );
}
