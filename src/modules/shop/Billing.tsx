import { useState, useMemo, useEffect } from 'react';
import {
  Package, PackageX, Plus, Minus, Trash2, Printer, Receipt, ShoppingCart, X,
  Banknote, Smartphone, CreditCard as CardIcon, Tag, MessageSquare,
  ChevronDown, Clock, Phone, User as UserIcon, RotateCcw, Layers, ScanBarcode,
  Share2, History, ArrowLeftRight,
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
import { JargonHint } from '../../components/ui/JargonHint';
import { SuccessOverlay } from '../../components/ui/SuccessOverlay';
import { customers, bills as initialBills } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId, formatInvoiceNo, gstBreakdown, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useHeldBills } from '../../hooks/useHeldBills';
import { useShopProfile } from '../../hooks/useShopProfile';
import { useShopCatalog } from '../../context/ShopCatalogContext';
import { playSuccess, playError, playClick, hapticSuccess, hapticTap, hapticError } from '../../utils/feedback';
import type { CartItem, InventoryItem, Bill, PaymentMethod, SplitTender } from '../../types';

type TenderMethod = PaymentMethod | 'udhaar';

const PAYMENT_METHODS: { value: TenderMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CardIcon },
  { value: 'udhaar', label: 'Udhaar', icon: Clock },
];

type Mode = 'sale' | 'return';

export function ShopBilling() {
  const { items: inventoryItems, allCategoryNames } = useShopCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [note, setNote] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [splitTenders, setSplitTenders] = useState<SplitTender[]>([{ method: 'cash', amount: 0 }]);
  const [roundOffEnabled, setRoundOffEnabled] = useState(true);
  const [mode, setMode] = useState<Mode>('sale');
  const [returnRefBillId, setReturnRefBillId] = useState('');
  const [heldOpen, setHeldOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [numpadItem, setNumpadItem] = useState<string | null>(null);
  const [numpadValue, setNumpadValue] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const { addToast } = useToast();
  const { held, add: addHeld, remove: removeHeld } = useHeldBills();
  const { profile, invoice: invoiceTpl } = useShopProfile();

  const categories = allCategoryNames;
  const customerOptions = useMemo(() => [
    { label: 'Walk-in customer', value: '' },
    ...customers.map(c => ({ label: `${c.name} (${c.phone})`, value: c.id })),
  ], []);
  const selectedCustomer = customers.find(c => c.id === customerId);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryItems.filter(i => {
      const matchesSearch = !q
        || i.name.toLowerCase().includes(q)
        || i.category.toLowerCase().includes(q)
        || (i.sku?.toLowerCase().includes(q) ?? false)
        || (i.barcode?.toLowerCase().includes(q) ?? false);
      const matchesCat = !category || i.category === category;
      return matchesSearch && matchesCat;
    });
  }, [search, category, inventoryItems]);

  const isUdhaar = mode === 'sale' && (paymentMethod as string) === 'udhaar' && !splitMode;

  const addToCart = (item: InventoryItem) => {
    if (item.stock === 0 && mode === 'sale') return;
    let added = true;
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (mode === 'sale' && existing.quantity >= item.stock) {
          addToast('warning', 'Max stock reached');
          added = false;
          return prev;
        }
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1, lineDiscount: 0 }];
    });
    if (added) { playClick(); hapticTap(); }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const maxQty = inventoryItems.find(i => i.id === id)?.stock || 0;
      const newQty = c.quantity + delta;
      if (mode === 'sale' && newQty > maxQty) return c;
      return { ...c, quantity: newQty };
    }).filter(c => c.quantity > 0));
  };

  const updateLineDiscount = (id: string, lineDiscount: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, lineDiscount: Math.max(0, lineDiscount) } : c));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const lineDiscountTotal = cart.reduce((sum, c) => sum + (c.lineDiscount ?? 0), 0);
  const billDiscountAmount = discountType === 'percent' ? Math.round(((subtotal - lineDiscountTotal) * discount) / 100) : discount;
  const beforeRound = Math.max(0, subtotal - lineDiscountTotal - billDiscountAmount);
  const rounded = roundOffEnabled ? Math.round(beforeRound) : beforeRound;
  const roundOff = rounded - beforeRound;
  const total = mode === 'return' ? -Math.abs(rounded) : rounded;
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const splitTotal = splitTenders.reduce((s, t) => s + (t.amount || 0), 0);
  const splitRemaining = Math.abs(total) - splitTotal;

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountOpen(false);
    setNote('');
    setNoteOpen(false);
    setBreakdownOpen(false);
    setSplitMode(false);
    setSplitTenders([{ method: 'cash', amount: 0 }]);
  };

  const validateBeforeBill = (): string | null => {
    if (cart.length === 0) return 'Cart is empty';
    if (mode === 'return' && !returnRefBillId) return 'Pick the original bill being returned';
    if (splitMode) {
      if (Math.abs(splitTotal - Math.abs(total)) > 1) return `Split tenders ${formatCurrency(splitTotal)} ≠ Total ${formatCurrency(Math.abs(total))}`;
    }
    return null;
  };

  const buildBill = (): Bill => {
    const customer = customers.find(c => c.id === customerId);
    const totalDiscount = lineDiscountTotal + billDiscountAmount;
    const allUdhaar = !splitMode && (paymentMethod as string) === 'udhaar';
    const tenders = splitMode ? splitTenders.filter(t => t.amount > 0) : undefined;
    const usesUdhaar = allUdhaar || (tenders?.some(t => t.method === 'udhaar') ?? false);
    return {
      id: 'B' + generateId().toUpperCase().slice(0, 7),
      date: new Date().toISOString(),
      customerName: customer?.name || 'Walk-in',
      customerId: customer?.id,
      items: cart,
      subtotal,
      discount: totalDiscount,
      total,
      paymentMethod: splitMode ? undefined : (allUdhaar ? undefined : paymentMethod),
      isUdhaar: usesUdhaar,
      paid: !usesUdhaar,
      note: note.trim() || undefined,
      splitTenders: tenders,
      roundOff: roundOffEnabled ? roundOff : undefined,
      isReturn: mode === 'return',
      returnedAgainst: mode === 'return' ? returnRefBillId : undefined,
      createdBy: 'Shopkeeper',
    };
  };

  const handleConfirmBill = () => {
    const err = validateBeforeBill();
    if (err) { addToast('error', err); playError(); hapticError(); return; }
    setConfirmOpen(true);
  };

  const finalizeBill = () => {
    const bill = buildBill();
    setLastBill(bill);
    setMobileCartOpen(false);
    setConfirmOpen(false);
    setShowSuccess(true);
    playSuccess();
    hapticSuccess();
    setTimeout(() => {
      setShowSuccess(false);
      setReceipt(bill);
    }, 1400);
  };

  const openNumpad = (itemId: string) => {
    const item = cart.find(c => c.id === itemId);
    if (item) { setNumpadItem(itemId); setNumpadValue(String(item.quantity)); }
  };
  const confirmNumpad = () => {
    const qty = parseInt(numpadValue, 10);
    if (numpadItem && qty > 0) {
      setCart(prev => prev.map(c => c.id === numpadItem ? { ...c, quantity: qty } : c));
    } else if (numpadItem && (qty === 0 || isNaN(qty))) {
      setCart(prev => prev.filter(c => c.id !== numpadItem));
    }
    setNumpadItem(null); setNumpadValue('');
  };
  const handleScanSubmit = () => {
    const q = scanInput.trim().toLowerCase();
    if (!q) return;
    const found = inventoryItems.find(i => i.barcode?.toLowerCase() === q || i.sku?.toLowerCase() === q);
    if (found) { addToCart(found); addToast('success', `${found.name} added`); setScanInput(''); setScannerOpen(false); }
    else { addToast('error', 'Item not found', `No item matched barcode/SKU "${scanInput}"`); }
  };

  const startNewBill = () => {
    clearCart();
    setCustomerId('');
    setPaymentMethod('cash');
    setReceipt(null);
    setMode('sale');
    setReturnRefBillId('');
  };

  const holdBill = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === customerId);
    const entry = addHeld({
      customerName: customer?.name || 'Walk-in',
      customerId: customer?.id,
      items: cart,
      total,
      note: note.trim() || undefined,
    });
    addToast('info', 'Bill held as draft', `Ref ${entry.ref} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatCurrency(total)}`);
    clearCart();
  };

  const resumeHeld = (ref: string) => {
    const h = held.find(x => x.ref === ref);
    if (!h) return;
    setCart(h.items);
    setCustomerId(h.customerId ?? '');
    setNote(h.note ?? '');
    removeHeld(ref);
    setHeldOpen(false);
    addToast('success', `Resumed ${ref}`);
  };

  const handleShareReceipt = () => {
    if (!receipt) return;
    const lines = [
      `*${profile.name}* — Bill ${formatInvoiceNo(receipt.id, receipt.date)}`,
      `Date: ${formatDate(receipt.date)}`,
      ...receipt.items.map(i => `• ${i.name} × ${i.quantity} = ${formatCurrency(i.price * i.quantity)}`),
      `*Total: ${formatCurrency(Math.abs(receipt.total))}*`,
      receipt.isUdhaar ? '⚠ Saved as Udhaar (unpaid)' : `Paid via ${receipt.paymentMethod?.toUpperCase() ?? 'Split'}`,
    ];
    const text = encodeURIComponent(lines.join('\n'));
    const phone = customers.find(c => c.id === receipt.customerId)?.phone;
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (mobileCartOpen) {
      const o = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = o; };
    }
  }, [mobileCartOpen]);

  const draftInvoice = useMemo(
    () => formatInvoiceNo(String(initialBills.length + 1).padStart(3, '0'), new Date().toISOString()),
    []
  );

  const cartProps: CartPaneProps = {
    cart, itemCount, subtotal, billDiscountAmount, lineDiscountTotal, total: Math.abs(total),
    customerId, onCustomerChange: setCustomerId, customerOptions, selectedCustomer,
    paymentMethod, onPaymentMethodChange: setPaymentMethod,
    discount, discountType,
    onDiscountChange: setDiscount, onDiscountTypeChange: setDiscountType,
    discountOpen, onDiscountOpenChange: setDiscountOpen,
    note, onNoteChange: setNote,
    noteOpen, onNoteOpenChange: setNoteOpen,
    breakdownOpen, onBreakdownOpenChange: setBreakdownOpen,
    onInc: (id: string) => updateQuantity(id, 1),
    onDec: (id: string) => updateQuantity(id, -1),
    onTapQty: openNumpad,
    onRemove: removeFromCart,
    onLineDiscount: updateLineDiscount,
    onClear: clearCart,
    onHold: holdBill,
    onGenerate: handleConfirmBill,
    draftInvoice,
    splitMode, onSplitModeChange: setSplitMode,
    splitTenders, onSplitTendersChange: setSplitTenders,
    splitRemaining,
    roundOffEnabled, onRoundOffChange: setRoundOffEnabled, roundOff,
    mode, returnRefBillId, onReturnRefChange: setReturnRefBillId,
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <SuccessOverlay
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={mode === 'return' ? 'Credit note created' : 'Bill generated!'}
        message={lastBill ? `${formatInvoiceNo(lastBill.id, lastBill.date)} · ${formatCurrency(Math.abs(lastBill.total))}` : undefined}
      />
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{mode === 'return' ? 'Process Return' : 'Point of Sale'}</h1>
          <p className="text-xs text-gray-500">{mode === 'return' ? 'Pick items being returned · creates credit note' : 'Tap items to add · cart on the right'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setMode('sale')}
              className={`px-3 py-1.5 text-xs font-medium ${mode === 'sale' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >Sale</button>
            <button
              type="button"
              onClick={() => setMode('return')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${mode === 'return' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <RotateCcw size={11} /> Return
            </button>
          </div>
          {/* Last bill chip */}
          {lastBill && (
            <button
              onClick={() => setReceipt(lastBill)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Receipt size={12} className="text-emerald-500" />
              Last: {formatCurrency(Math.abs(lastBill.total))} · {formatRelativeTime(lastBill.date)}
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Reprint</span>
            </button>
          )}
          {/* Held queue */}
          <button
            onClick={() => setHeldOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <History size={12} className="text-amber-500" />
            Held
            {held.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">{held.length}</span>
            )}
          </button>
          <Badge variant={mode === 'return' ? 'warning' : 'success'} className="text-[11px]">{mode === 'return' ? 'Return mode' : 'Open'}</Badge>
          <span className="hidden sm:inline-flex font-mono text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            Next · {draftInvoice}
          </span>
        </div>
      </div>

      {/* Return mode banner */}
      {mode === 'return' && (
        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 flex flex-col sm:flex-row sm:items-center gap-3">
          <ArrowLeftRight size={16} className="text-orange-600 dark:text-orange-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Return mode active — generates credit note</p>
            <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80">Items will reverse stock and total will be negative.</p>
          </div>
          <div className="w-full sm:w-64">
            <Dropdown
              options={[{ label: 'Pick original bill *', value: '' }, ...initialBills.map(b => ({ label: `${b.id} · ${b.customerName} · ${formatCurrency(b.total)}`, value: b.id }))]}
              value={returnRefBillId}
              onChange={e => setReturnRefBillId(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT — item picker */}
        <section className="space-y-3 min-w-0">
          <Card padding={false}>
            <div className="p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Scan barcode, SKU, or search by name…"
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
                <Button variant="secondary" icon={<ScanBarcode size={16} />} onClick={() => setScannerOpen(true)}>Scan</Button>
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
                    disabled={isOut && mode === 'sale'}
                    className={`group relative flex flex-col gap-1.5 rounded-xl border bg-white dark:bg-gray-900 p-2.5 text-left transition-all ${
                      (isOut && mode === 'sale')
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
                      {isOut ? <Badge variant="danger">Out</Badge> : isLow ? <Badge variant="warning">Low</Badge> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.sku ? `${item.sku} · ` : ''}{item.category}</p>
                    </div>
                    <div className="flex items-baseline justify-between gap-1 mt-auto">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums text-sm">{formatCurrency(item.price)}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{item.stock} {item.unit}</span>
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
              <p className="text-xs text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'} · {formatCurrency(Math.abs(total))}</p>
              {(billDiscountAmount + lineDiscountTotal) > 0 && <p className="text-xs text-emerald-600">–{formatCurrency(billDiscountAmount + lineDiscountTotal)} discount</p>}
            </div>
            <Button variant="primary" size="lg" icon={<ShoppingCart size={16} />} onClick={() => setMobileCartOpen(true)}>
              Review · {formatCurrency(Math.abs(total))}
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

      {/* Confirm-before-print modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={mode === 'return' ? 'Confirm return' : 'Confirm bill'} size="sm">
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {mode === 'return' ? 'A credit note will be created and stock reversed.' : 'Charge and print this bill?'}
          </p>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/40 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Customer</span><span className="font-medium">{selectedCustomer?.name ?? 'Walk-in'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Items</span><span className="font-medium">{itemCount}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-lg tabular-nums">{formatCurrency(Math.abs(total))}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-medium uppercase">{splitMode ? 'Split' : paymentMethod}</span></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={finalizeBill}>Confirm & {mode === 'return' ? 'Refund' : 'Print'}</Button>
          </div>
        </div>
      </Modal>

      {/* Held bills modal */}
      <Modal open={heldOpen} onClose={() => setHeldOpen(false)} title="Held bills queue" size="md">
        {held.length === 0 ? (
          <EmptyState icon={<History size={28} />} title="No held bills" description="Use the Hold button while billing to park a draft and pick it up later." compact />
        ) : (
          <ul className="space-y-2">
            {held.map(h => (
              <li key={h.ref} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">{h.ref}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{h.customerName}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {h.items.length} item{h.items.length === 1 ? '' : 's'} · {formatCurrency(h.total)} · {formatRelativeTime(h.createdAt)}
                  </p>
                  {h.note && <p className="text-[11px] text-gray-400 italic truncate">"{h.note}"</p>}
                </div>
                <Button variant="primary" size="sm" onClick={() => resumeHeld(h.ref)}>Resume</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => removeHeld(h.ref)}>Drop</Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Numpad modal */}
      <Modal open={!!numpadItem} onClose={() => setNumpadItem(null)} title="Enter quantity" size="sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-full h-14 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
            {numpadValue || '0'}
          </div>
          <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} type="button" onClick={() => setNumpadValue(v => v === '0' ? String(n) : v + n)} className="h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-transform">{n}</button>
            ))}
            <button type="button" onClick={() => setNumpadValue('')} className="h-12 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-transform">C</button>
            <button type="button" onClick={() => setNumpadValue(v => v === '0' ? '0' : v + '0')} className="h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-transform">0</button>
            <button type="button" onClick={() => setNumpadValue(v => v.slice(0, -1))} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-transform">&#9003;</button>
          </div>
          <Button variant="primary" className="w-full max-w-[220px]" onClick={confirmNumpad}>Set quantity</Button>
        </div>
      </Modal>

      {/* Barcode scanner modal */}
      <Modal open={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan barcode / SKU" size="sm">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 border border-gray-700 overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-emerald-400 rounded-tl-md" />
            <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-emerald-400 rounded-tr-md" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-emerald-400 rounded-bl-md" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-emerald-400 rounded-br-md" />
            {/* Animated scan line */}
            <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-scan-line" />
            {/* Mock barcode pattern */}
            <div className="absolute inset-x-12 top-1/2 -translate-y-12 flex items-end justify-center gap-[1px] h-12 opacity-30">
              {[2,4,2,3,1,5,2,1,3,2,4,2,1,3,2,4,2,3,1,5,2,1,3,2].map((w, i) => (
                <span key={i} className="bg-white" style={{ width: `${w}px`, height: '100%' }} />
              ))}
            </div>
            <div className="absolute bottom-3 inset-x-0 text-center">
              <p className="text-xs text-emerald-400 font-medium tracking-wider uppercase">Scanning…</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Point camera at barcode or type below</p>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); handleScanSubmit(); }} className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="e.g. 8901234567890 or SKU-001"
                autoFocus
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
            <Button variant="primary" type="submit" disabled={!scanInput.trim()}>Add</Button>
          </form>
          <p className="text-[11px] text-gray-500 text-center">Tip: USB barcode scanners work as keyboard input — just keep this field focused.</p>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title={receipt?.isReturn ? 'Credit Note' : 'Bill Receipt'} size="md">
        {receipt && (() => {
          const tax = gstBreakdown(Math.abs(receipt.total));
          const itemCountTotal = receipt.items.reduce((s, it) => s + it.quantity, 0);
          return (
            <div className="space-y-4">
              <div className="mx-auto bg-white text-gray-900 font-mono text-[12px] leading-tight max-w-[320px] shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                <div className="h-2 bg-[length:14px_8px] bg-[radial-gradient(circle_at_50%_100%,#fff_4px,#e5e7eb_5px)] dark:bg-[radial-gradient(circle_at_50%_100%,#fff_4px,#374151_5px)]" />
                <div className="px-4 py-3">
                  <div className="text-center">
                    <p className="text-[14px] font-bold tracking-wide uppercase">{profile.name}</p>
                    <p className="text-[10.5px]">{profile.address}</p>
                    <p className="text-[10.5px]">Ph {profile.phone}</p>
                    {invoiceTpl.showGstin && <p className="text-[10.5px]">GSTIN: {profile.gstin}</p>}
                  </div>
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <p className="text-center text-[11px] font-bold tracking-[0.18em] uppercase">{receipt.isReturn ? 'Credit Note' : 'Tax Invoice'}</p>
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between"><span>Inv No</span><span className="font-semibold">{formatInvoiceNo(receipt.id, receipt.date)}</span></div>
                    <div className="flex justify-between"><span>Date</span><span>{formatDate(receipt.date)}</span></div>
                    <div className="flex justify-between"><span>Customer</span><span className="truncate max-w-[170px] text-right font-semibold">{receipt.customerName}</span></div>
                    {receipt.returnedAgainst && <div className="flex justify-between"><span>Against</span><span>{receipt.returnedAgainst}</span></div>}
                  </div>
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex-1">Item</span>
                    <span className="w-10 text-right">Qty</span>
                    <span className="w-16 text-right">Price</span>
                    <span className="w-16 text-right">Amt</span>
                  </div>
                  <div className="my-1 border-t border-dashed border-gray-400" />
                  <ul className="space-y-1.5">
                    {receipt.items.map(it => (
                      <li key={it.id} className="text-[11px]">
                        <p className="truncate font-semibold">{it.name}</p>
                        <div className="flex justify-between tabular-nums">
                          <span className="flex-1 text-gray-500">&nbsp;</span>
                          <span className="w-10 text-right">{it.quantity}</span>
                          <span className="w-16 text-right">{it.price.toLocaleString('en-IN')}</span>
                          <span className="w-16 text-right">{(it.price * it.quantity - (it.lineDiscount ?? 0)).toLocaleString('en-IN')}</span>
                        </div>
                        {(it.lineDiscount ?? 0) > 0 && (
                          <p className="text-[10px] text-right text-emerald-700">− line disc {it.lineDiscount}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <div className="space-y-0.5 text-[11px] tabular-nums">
                    <div className="flex justify-between"><span>Items</span><span>{itemCountTotal}</span></div>
                    <div className="flex justify-between"><span>Subtotal</span><span>{(receipt.subtotal || Math.abs(receipt.total)).toLocaleString('en-IN')}</span></div>
                    {(receipt.discount ?? 0) > 0 && <div className="flex justify-between"><span>Discount</span><span>− {receipt.discount!.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between"><span>Taxable</span><span>{tax.taxable.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>CGST @ 9%</span><span>{tax.cgst.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>SGST @ 9%</span><span>{tax.sgst.toLocaleString('en-IN')}</span></div>
                    {(receipt.roundOff ?? 0) !== 0 && <div className="flex justify-between"><span>Round-off</span><span>{(receipt.roundOff! >= 0 ? '+' : '−')} {Math.abs(receipt.roundOff!).toFixed(2)}</span></div>}
                  </div>
                  <div className="my-2 border-t-2 border-double border-gray-700" />
                  <div className="flex justify-between font-bold text-[14px] tabular-nums">
                    <span>{receipt.isReturn ? 'REFUND' : 'TOTAL'}</span>
                    <span>₹ {Math.abs(receipt.total).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between"><span>Status</span>
                      <span className="font-bold uppercase">
                        {receipt.isReturn ? '** REFUND ISSUED **' : receipt.isUdhaar ? '** UDHAAR / UNPAID **' : 'PAID'}
                      </span>
                    </div>
                    {receipt.splitTenders ? (
                      <>
                        {receipt.splitTenders.map((t, idx) => (
                          <div key={idx} className="flex justify-between"><span className="uppercase">{t.method}</span><span>₹ {t.amount.toLocaleString('en-IN')}</span></div>
                        ))}
                      </>
                    ) : receipt.paymentMethod ? (
                      <div className="flex justify-between"><span>Mode</span><span className="uppercase">{receipt.paymentMethod}</span></div>
                    ) : null}
                  </div>
                  {receipt.note && (
                    <>
                      <div className="my-2 border-t border-dashed border-gray-400" />
                      <p className="text-[10.5px] italic">Note: {receipt.note}</p>
                    </>
                  )}
                  <div className="my-2 border-t border-dashed border-gray-400" />
                  <div className="text-center text-[10.5px] space-y-0.5">
                    <p className="font-semibold">~ {invoiceTpl.footerText} ~</p>
                  </div>
                </div>
                <div className="h-2 bg-[length:14px_8px] bg-[radial-gradient(circle_at_50%_0%,#fff_4px,#e5e7eb_5px)] dark:bg-[radial-gradient(circle_at_50%_0%,#fff_4px,#374151_5px)]" />
              </div>

              <div className="flex justify-center">
                {receipt.isReturn
                  ? <Badge variant="warning">Return processed — credit note</Badge>
                  : receipt.isUdhaar
                    ? <Badge variant="warning">Saved as Udhaar — payment pending</Badge>
                    : <Badge variant="success">Marked Paid</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="lg" icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>
                <Button variant="secondary" size="lg" icon={<Share2 size={16} />} onClick={handleShareReceipt}>WhatsApp</Button>
                <Button variant="primary" size="lg" icon={<Receipt size={16} />} onClick={startNewBill}>New Bill</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Mobile FAB shortcut for scan */}
      <button
        onClick={() => addToast('info', 'Scanner integration coming soon')}
        className="lg:hidden fixed bottom-32 right-4 z-30 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700"
        aria-label="Scan barcode"
      >
        <ScanBarcode size={20} />
      </button>
    </div>
  );
}

interface CartPaneProps {
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  billDiscountAmount: number;
  lineDiscountTotal: number;
  total: number;
  customerId: string;
  onCustomerChange: (v: string) => void;
  customerOptions: { label: string; value: string }[];
  selectedCustomer: { name: string; phone: string; pendingAmount: number } | undefined;
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
  onTapQty: (id: string) => void;
  onRemove: (id: string) => void;
  onLineDiscount: (id: string, amount: number) => void;
  onClear: () => void;
  onHold: () => void;
  onGenerate: () => void;
  draftInvoice: string;
  splitMode: boolean;
  onSplitModeChange: (v: boolean) => void;
  splitTenders: SplitTender[];
  onSplitTendersChange: (v: SplitTender[]) => void;
  splitRemaining: number;
  roundOffEnabled: boolean;
  onRoundOffChange: (v: boolean) => void;
  roundOff: number;
  mode: Mode;
  returnRefBillId: string;
  onReturnRefChange: (v: string) => void;
}

function CartPane({
  cart, itemCount, subtotal, billDiscountAmount, lineDiscountTotal, total,
  customerId, onCustomerChange, customerOptions, selectedCustomer,
  paymentMethod, onPaymentMethodChange,
  discount, discountType, onDiscountChange, onDiscountTypeChange,
  discountOpen, onDiscountOpenChange,
  note, onNoteChange,
  noteOpen, onNoteOpenChange,
  breakdownOpen, onBreakdownOpenChange,
  onInc, onDec, onTapQty, onRemove, onLineDiscount, onClear, onHold, onGenerate,
  draftInvoice,
  splitMode, onSplitModeChange,
  splitTenders, onSplitTendersChange, splitRemaining,
  roundOffEnabled, onRoundOffChange, roundOff,
  mode,
}: CartPaneProps) {
  const isEmpty = cart.length === 0;
  const tax = gstBreakdown(total);
  const isUdhaar = !splitMode && (paymentMethod as string) === 'udhaar';

  const updateTender = (idx: number, patch: Partial<SplitTender>) => {
    onSplitTendersChange(splitTenders.map((t, i) => i === idx ? { ...t, ...patch } : t));
  };
  const addTender = () => onSplitTendersChange([...splitTenders, { method: 'cash', amount: 0 }]);
  const removeTender = (idx: number) => onSplitTendersChange(splitTenders.filter((_, i) => i !== idx));
  const autoFillRemainingOnLast = () => {
    if (splitTenders.length === 0) return;
    const idx = splitTenders.length - 1;
    const others = splitTenders.slice(0, idx).reduce((s, t) => s + t.amount, 0);
    updateTender(idx, { amount: Math.max(0, total - others) });
  };

  return (
    <Card padding={false} className="flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-gray-500">{mode === 'return' ? 'Credit note' : 'Current Bill'}</p>
          <p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 truncate">{draftInvoice}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 tabular-nums">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
          {!isEmpty && <button onClick={onClear} className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors">Clear</button>}
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
        <Dropdown options={customerOptions} value={customerId} onChange={e => onCustomerChange(e.target.value)} />
        {selectedCustomer && (
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <Phone size={11} className="text-gray-400" />
            <a href={`tel:${selectedCustomer.phone}`} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600">{selectedCustomer.phone}</a>
            {selectedCustomer.pendingAmount > 0 && (
              <span className="ml-auto text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                Udhaar {formatCurrency(selectedCustomer.pendingAmount)}
              </span>
            )}
          </div>
        )}
      </div>

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
              <li key={item.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500 tabular-nums">{formatCurrency(item.price)} × {item.quantity}{(item.lineDiscount ?? 0) > 0 ? ` − ₹${item.lineDiscount}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onDec(item.id)} className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"><Minus size={11} /></button>
                    <button onClick={() => onTapQty(item.id)} className="w-7 text-center text-[13px] font-semibold tabular-nums rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Tap to enter exact quantity">{item.quantity}</button>
                    <button onClick={() => onInc(item.id)} className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"><Plus size={11} /></button>
                  </div>
                  <p className="w-16 text-right text-[12px] font-semibold tabular-nums">{formatCurrency(item.price * item.quantity - (item.lineDiscount ?? 0))}</p>
                  <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
                {/* Line discount input — show when expanded */}
                <details className="mt-1">
                  <summary className="text-[10px] text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline list-none flex items-center gap-1">
                    <Tag size={9} /> Line discount
                  </summary>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="₹ off this line"
                      value={item.lineDiscount || ''}
                      onChange={e => onLineDiscount(item.id, Number(e.target.value))}
                      className="flex-1 h-7 text-[11px] rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2"
                    />
                    {(item.lineDiscount ?? 0) > 0 && (
                      <button onClick={() => onLineDiscount(item.id, 0)} className="text-[10px] text-gray-400 hover:text-red-500">Clear</button>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isEmpty && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2 flex flex-wrap items-center gap-2">
            {!discountOpen && billDiscountAmount === 0 ? (
              <button onClick={() => onDiscountOpenChange(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <Tag size={11} /> Bill discount
              </button>
            ) : (
              <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Bill discount</span>
                  <div className="flex ml-auto gap-1">
                    {(['flat', 'percent'] as const).map(t => (
                      <button key={t} onClick={() => onDiscountTypeChange(t)} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${discountType === t ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        {t === 'flat' ? '₹' : '%'}
                      </button>
                    ))}
                    <button onClick={() => { onDiscountChange(0); onDiscountOpenChange(false); }} className="ml-1 px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X size={11} /></button>
                  </div>
                </div>
                <Input type="number" value={discount || ''} onChange={e => onDiscountChange(Number(e.target.value))} placeholder={discountType === 'flat' ? 'Amount in ₹' : 'Percentage'} />
                {billDiscountAmount > 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">−{formatCurrency(billDiscountAmount)} off</p>}
              </div>
            )}
            {!noteOpen && !note ? (
              <button onClick={() => onNoteOpenChange(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <MessageSquare size={11} /> Add note
              </button>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1"><MessageSquare size={11} /> Note</p>
                  <button onClick={() => { onNoteChange(''); onNoteOpenChange(false); }} className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X size={11} /></button>
                </div>
                <textarea rows={2} value={note} onChange={e => onNoteChange(e.target.value)} placeholder="Add a note..." className="w-full text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" />
              </div>
            )}
          </div>

          <button
            onClick={() => onBreakdownOpenChange(!breakdownOpen)}
            className="w-full px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800"
          >
            <span>Tax breakdown · GST @ 18%</span>
            <ChevronDown size={11} className={`transition-transform ${breakdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {breakdownOpen && (
            <div className="px-4 pb-2 space-y-1 text-[11px] bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
              {lineDiscountTotal > 0 && <div className="flex items-center justify-between"><span className="text-emerald-600">Line discounts</span><span className="text-emerald-600 tabular-nums">−{formatCurrency(lineDiscountTotal)}</span></div>}
              {billDiscountAmount > 0 && <div className="flex items-center justify-between"><span className="text-emerald-600">Bill discount</span><span className="text-emerald-600 tabular-nums">−{formatCurrency(billDiscountAmount)}</span></div>}
              <div className="flex items-center justify-between"><span className="text-gray-500">Taxable value</span><span className="tabular-nums">{formatCurrency(tax.taxable)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">CGST @ 9%</span><span className="tabular-nums">{formatCurrency(tax.cgst)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">SGST @ 9%</span><span className="tabular-nums">{formatCurrency(tax.sgst)}</span></div>
              {Math.abs(roundOff) > 0.001 && <div className="flex items-center justify-between"><span className="text-gray-500 flex items-center gap-1">Round-off <JargonHint term="roundoff" /></span><span className="tabular-nums">{(roundOff >= 0 ? '+' : '−')}{Math.abs(roundOff).toFixed(2)}</span></div>}
            </div>
          )}

          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500 flex items-center gap-1">Round off <JargonHint term="roundoff" /></div>
            <Toggle checked={roundOffEnabled} onChange={onRoundOffChange} />
          </div>

          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500 flex items-center gap-1"><Layers size={11} /> Split tender <JargonHint term="splittender" /></div>
            <Toggle checked={splitMode} onChange={v => { onSplitModeChange(v); if (v && splitTenders.length === 1 && splitTenders[0].amount === 0) onSplitTendersChange([{ method: 'cash', amount: 0 }, { method: 'upi', amount: 0 }]); }} />
          </div>

          {splitMode ? (
            <div className="px-4 pb-3 space-y-2">
              {splitTenders.map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={t.method} onChange={e => updateTender(idx, { method: e.target.value as TenderMethod })} className="text-[11px] h-8 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 uppercase">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input type="number" value={t.amount || ''} onChange={e => updateTender(idx, { amount: Number(e.target.value) })} placeholder="₹" className="flex-1 h-8 text-[11px] rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 tabular-nums" />
                  {splitTenders.length > 1 && <button onClick={() => removeTender(idx)} className="text-gray-400 hover:text-red-500"><X size={13} /></button>}
                </div>
              ))}
              <div className="flex items-center justify-between text-[11px]">
                <button onClick={addTender} className="text-emerald-600 dark:text-emerald-400 hover:underline">+ Add tender</button>
                <button onClick={autoFillRemainingOnLast} className="text-gray-500 hover:underline">Auto-fill</button>
              </div>
              <div className="flex items-center justify-between text-[11px] p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                <span className="text-gray-500">Remaining</span>
                <span className={`font-semibold tabular-nums ${Math.abs(splitRemaining) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>{formatCurrency(Math.abs(splitRemaining))}</span>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-1.5">Payment method</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onPaymentMethodChange(value as PaymentMethod)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${
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
              <span className="text-[11px] text-gray-500">{mode === 'return' ? 'Refund amount' : isUdhaar ? 'Udhaar amount' : 'Total payable'}</span>
              <span className="text-2xl font-bold tabular-nums leading-none">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="primary" size="lg" onClick={onGenerate} icon={mode === 'return' ? <RotateCcw size={16} /> : isUdhaar ? <Clock size={16} /> : <Receipt size={16} />} className="w-full">
                {mode === 'return' ? 'Process Refund' : isUdhaar ? 'Save Udhaar' : 'Charge & Print'}
              </Button>
              <Button variant="secondary" size="lg" onClick={onHold} icon={<UserIcon size={14} />}>Hold</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
