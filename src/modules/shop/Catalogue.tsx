import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  BookOpen,
  LayoutGrid,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Car,
  Tag,
  Package,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useCatalogue } from '../../context/CatalogueContext';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useCostPriceSecurity } from '../../hooks/useCostPriceSecurity';
import { usePermissions } from '../../context/PermissionContext';
import type { CatalogueItem } from '../../types';

type ViewMode = 'grid' | 'book';

const BOOK_PAGE_SIZE = 8;

const EMPTY_FORM: Omit<CatalogueItem, 'id'> = {
  partName: '',
  partNumber: '',
  brand: '',
  category: '',
  vehicleCompatibility: [],
  mrp: 0,
  sellingPrice: undefined,
  costPrice: undefined,
  position: '',
  side: '',
  rackLocation: '',
  subCategory: '',
  notes: '',
};

function getUnique(items: CatalogueItem[], key: 'brand' | 'category'): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const v = item[key];
    if (v) set.add(v);
  }
  return [...set].sort();
}

function getAllVehicles(items: CatalogueItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    item.vehicleCompatibility?.forEach(v => set.add(v));
  }
  return [...set].sort();
}

function partInitials(name: string) {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ── CSV parser ──
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuote = false; }
        else { cur += ch; }
      } else {
        if (ch === ',') { out.push(cur); cur = ''; }
        else if (ch === '"') { inQuote = true; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

const IMPORT_REQUIRED = ['partName', 'brand', 'category', 'mrp'];
const IMPORT_ALL = ['partName', 'partNumber', 'brand', 'category', 'subCategory', 'vehicleCompatibility', 'position', 'side', 'mrp', 'sellingPrice', 'costPrice', 'rackLocation', 'notes'];

export function ShopCatalogue() {
  const { items, addItem, updateItem, deleteItem, importItems } = useCatalogue();
  const { addToast } = useToast();
  const cpSec = useCostPriceSecurity();
  const { can } = usePermissions();
  const canAdd = can('catalogue', 'add');
  const canEdit = can('catalogue', 'edit');
  const canDelete = can('catalogue', 'delete');

  const [cpPinInput, setCpPinInput] = useState('');
  const [cpPinModalOpen, setCpPinModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sideFilter, setSideFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [bookPage, setBookPage] = useState(0);
  const [detailItem, setDetailItem] = useState<CatalogueItem | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Add / Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CatalogueItem, 'id'>>(EMPTY_FORM);
  const [vehicleInput, setVehicleInput] = useState('');

  // Import
  const [importOpen, setImportOpen] = useState(false);

  const allVehicles = useMemo(() => getAllVehicles(items), [items]);
  const allBrands = useMemo(() => getUnique(items, 'brand'), [items]);
  const allCategories = useMemo(() => getUnique(items, 'category'), [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => {
      if (term) {
        const fields = [
          item.partName, item.brand, item.partNumber, item.category,
          ...(item.vehicleCompatibility ?? []),
        ];
        if (!fields.some(f => f?.toLowerCase().includes(term))) return false;
      }
      if (vehicleFilter && !item.vehicleCompatibility?.some(v => v.toLowerCase().includes(vehicleFilter.toLowerCase()))) return false;
      if (brandFilter && item.brand !== brandFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (positionFilter && item.position !== positionFilter) return false;
      if (sideFilter && item.side !== sideFilter) return false;
      return true;
    });
  }, [items, search, vehicleFilter, brandFilter, categoryFilter, positionFilter, sideFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOK_PAGE_SIZE));
  const bookItems = filtered.slice(bookPage * BOOK_PAGE_SIZE, (bookPage + 1) * BOOK_PAGE_SIZE);

  const activeFilterCount = [vehicleFilter, brandFilter, categoryFilter, positionFilter, sideFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setVehicleFilter(''); setBrandFilter(''); setCategoryFilter('');
    setPositionFilter(''); setSideFilter(''); setSearch('');
  };

  // ── Form helpers ──
  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setVehicleInput('');
    setFormOpen(true);
  };

  const openEditForm = (item: CatalogueItem) => {
    setEditingId(item.id);
    setForm({
      partName: item.partName,
      partNumber: item.partNumber,
      brand: item.brand,
      category: item.category,
      subCategory: item.subCategory ?? '',
      vehicleCompatibility: item.vehicleCompatibility ?? [],
      position: item.position ?? '',
      side: item.side ?? '',
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      rackLocation: item.rackLocation ?? '',
      notes: item.notes ?? '',
    });
    setVehicleInput('');
    setFormOpen(true);
  };

  const addVehicle = () => {
    const v = vehicleInput.trim();
    if (!v) return;
    if (!form.vehicleCompatibility.includes(v)) {
      setForm(f => ({ ...f, vehicleCompatibility: [...f.vehicleCompatibility, v] }));
    }
    setVehicleInput('');
  };

  const removeVehicle = (v: string) => {
    setForm(f => ({ ...f, vehicleCompatibility: f.vehicleCompatibility.filter(x => x !== v) }));
  };

  const handleFormSave = () => {
    if (!form.partName.trim() || !form.brand.trim() || !form.category.trim() || !form.mrp) {
      addToast('error', 'Please fill Part Name, Brand, Category, and MRP');
      return;
    }
    if (editingId) {
      updateItem(editingId, form);
      addToast('success', 'Part updated');
      if (detailItem?.id === editingId) setDetailItem({ id: editingId, ...form });
    } else {
      addItem(form);
      addToast('success', 'Part added to catalogue');
    }
    setFormOpen(false);
  };

  const handleDelete = (item: CatalogueItem) => {
    if (!confirm(`Remove "${item.partName}" from catalogue?`)) return;
    deleteItem(item.id);
    if (detailItem?.id === item.id) setDetailItem(null);
    addToast('success', 'Part removed');
  };

  // ── Filter sidebar ──
  const FilterSidebar = ({ className = '', onDone }: { className?: string; onDone?: () => void }) => (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter size={15} /> Filters
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={() => { clearAllFilters(); onDone?.(); }} className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Vehicle */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Car size={13} /> Vehicle
        </label>
        <SearchableSelect
          value={vehicleFilter}
          onChange={v => { setVehicleFilter(v); setBookPage(0); }}
          options={[
            { label: 'All vehicles', value: '' },
            ...allVehicles.map(v => ({ label: v, value: v })),
          ]}
          placeholder="Search vehicle..."
          clearable={!!vehicleFilter}
          size="sm"
        />
      </div>

      {/* Brand */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Tag size={13} /> Brand
        </label>
        <div className="flex flex-wrap gap-1.5">
          {allBrands.map(b => (
            <button
              key={b}
              onClick={() => { setBrandFilter(prev => prev === b ? '' : b); setBookPage(0); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                brandFilter === b
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Package size={13} /> Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map(c => (
            <button
              key={c}
              onClick={() => { setCategoryFilter(prev => prev === c ? '' : c); setBookPage(0); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                categoryFilter === c
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Front / Rear</label>
        <div className="flex gap-1.5">
          {['front', 'rear'].map(p => (
            <button
              key={p}
              onClick={() => { setPositionFilter(prev => prev === p ? '' : p); setBookPage(0); }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                positionFilter === p
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Side */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Side</label>
        <div className="flex gap-1.5">
          {['left', 'right', 'both'].map(s => (
            <button
              key={s}
              onClick={() => { setSideFilter(prev => prev === s ? '' : s); setBookPage(0); }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                sideFilter === s
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {onDone && (
        <Button variant="primary" className="w-full" onClick={onDone}>
          Show {filtered.length} results
        </Button>
      )}
    </div>
  );

  // ── Catalogue Card ──
  const CatalogueCard = ({ item }: { item: CatalogueItem }) => (
    <button
      onClick={() => setDetailItem(item)}
      className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 text-left group cursor-pointer"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 flex items-center justify-center overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform">
          {partInitials(item.partName)}
        </div>
        {item.brand && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-gray-900/90 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 backdrop-blur-sm">
            {item.brand}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-3.5 space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {item.partName}
          </h4>
          {item.partNumber && (
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">{item.partNumber}</p>
          )}
        </div>

        {/* Compatible vehicles */}
        {item.vehicleCompatibility.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.vehicleCompatibility.slice(0, 3).map(v => (
              <span key={v} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                {v}
              </span>
            ))}
            {item.vehicleCompatibility.length > 3 && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">
                +{item.vehicleCompatibility.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price & rack */}
        <div className="flex items-end justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">MRP</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(item.mrp)}</p>
            {item.sellingPrice != null && item.sellingPrice < item.mrp && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Sell: {formatCurrency(item.sellingPrice)}
              </p>
            )}
          </div>
          {item.rackLocation && (
            <div className="text-right">
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5 justify-end"><MapPin size={9} /> Rack</p>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono">{item.rackLocation}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={22} className="text-emerald-600" /> Parts Catalogue
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} part{filtered.length === 1 ? '' : 's'} found · {items.length} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {cpSec.enabled && (
            cpSec.revealed
              ? <Button variant="ghost" size="sm" icon={<EyeOff size={14} />} onClick={() => cpSec.hide()}>Hide Cost</Button>
              : <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => setCpPinModalOpen(true)}>Reveal Cost</Button>
          )}
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 h-8 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              onClick={() => { setViewMode('book'); setBookPage(0); }}
              className={`px-2.5 h-8 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'book' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <BookOpen size={14} /> Book
            </button>
          </div>
          {canAdd && <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setImportOpen(true)}>Import</Button>}
          {canAdd && <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddForm}>Add Part</Button>}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setBookPage(0); }}
            placeholder="Search by vehicle, part name, OEM number, brand..."
            className="w-full h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative"
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 animate-fade-in-up">
          {vehicleFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Car size={11} /> {vehicleFilter}
              <button onClick={() => setVehicleFilter('')} className="ml-0.5 hover:text-blue-900"><X size={12} /></button>
            </span>
          )}
          {brandFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Tag size={11} /> {brandFilter}
              <button onClick={() => setBrandFilter('')} className="ml-0.5 hover:text-emerald-900"><X size={12} /></button>
            </span>
          )}
          {categoryFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              <Package size={11} /> {categoryFilter}
              <button onClick={() => setCategoryFilter('')} className="ml-0.5 hover:text-purple-900"><X size={12} /></button>
            </span>
          )}
          {positionFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              {positionFilter}
              <button onClick={() => setPositionFilter('')} className="ml-0.5"><X size={12} /></button>
            </span>
          )}
          {sideFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              {sideFilter}
              <button onClick={() => setSideFilter('')} className="ml-0.5"><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      {/* Main layout: sidebar + cards */}
      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <FilterSidebar />
          </div>
        </aside>

        {/* Cards area */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Search size={28} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No parts found</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-xs">Try a different search or adjust your filters.</p>
              <Button variant="secondary" size="sm" onClick={clearAllFilters}>Clear all filters</Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(item => <CatalogueCard key={item.id} item={item} />)}
            </div>
          ) : (
            /* Book view */
            <div>
              <div className="mb-4 pb-3 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {categoryFilter || brandFilter || 'All Parts'} Catalogue
                  </span>
                </div>
                <span className="text-xs text-gray-500 tabular-nums">Page {bookPage + 1} of {totalPages}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {bookItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-center group cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <span className="text-xl font-bold text-gray-400 dark:text-gray-500">{partInitials(item.partName)}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">{item.partName}</h4>
                    {item.brand && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{item.brand}</p>}
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 tabular-nums">{formatCurrency(item.mrp)}</p>
                  </button>
                ))}
              </div>

              {/* Book pagination */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={() => setBookPage(p => Math.max(0, p - 1))} disabled={bookPage === 0}>Previous</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageIdx = i;
                    if (totalPages > 7) {
                      if (bookPage < 4) pageIdx = i;
                      else if (bookPage > totalPages - 5) pageIdx = totalPages - 7 + i;
                      else pageIdx = bookPage - 3 + i;
                    }
                    return (
                      <button key={pageIdx} onClick={() => setBookPage(pageIdx)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${bookPage === pageIdx ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        {pageIdx + 1}
                      </button>
                    );
                  })}
                </div>
                <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={() => setBookPage(p => Math.min(totalPages - 1, p + 1))} disabled={bookPage >= totalPages - 1}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <Modal open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters" size="md">
        <FilterSidebar onDone={() => setMobileFiltersOpen(false)} />
      </Modal>

      {/* ── Part Detail Modal ── */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Part Details" size="lg">
        {detailItem && (() => {
          const margin = detailItem.costPrice && detailItem.mrp ? ((detailItem.mrp - detailItem.costPrice) / detailItem.mrp * 100) : null;
          return (
            <div className="space-y-5">
              <div className="flex gap-5">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 flex items-center justify-center shrink-0">
                  <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">{partInitials(detailItem.partName)}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  {detailItem.brand && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
                      {detailItem.brand}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{detailItem.partName}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {detailItem.partNumber && <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{detailItem.partNumber}</span>}
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{detailItem.category}</span>
                    {detailItem.position && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded capitalize">{detailItem.position}</span>}
                    {detailItem.side && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded capitalize">{detailItem.side}</span>}
                  </div>
                </div>
              </div>

              {/* Compatible vehicles */}
              {detailItem.vehicleCompatibility.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1.5"><Car size={13} /> Compatible Vehicles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailItem.vehicleCompatibility.map(v => (
                      <span key={v} className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">MRP</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(detailItem.mrp)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sell Price</p>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{detailItem.sellingPrice != null ? formatCurrency(detailItem.sellingPrice) : '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cost Price</p>
                  {cpSec.isCostHidden ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-400"><Lock size={13} /> ••••••</span>
                  ) : (
                    <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{detailItem.costPrice != null ? formatCurrency(detailItem.costPrice) : '—'}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Margin</p>
                  {cpSec.isCostHidden ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-400"><Lock size={13} /> ••••••</span>
                  ) : (
                    <p className={`text-base font-bold tabular-nums ${margin != null && margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {margin != null ? `${margin.toFixed(1)}%` : '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Rack location */}
              {detailItem.rackLocation && (
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 inline-flex items-center gap-3">
                  <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">Rack Location</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-300 font-mono">{detailItem.rackLocation}</p>
                  </div>
                </div>
              )}

              {detailItem.notes && (
                <p className="text-xs text-gray-500 italic px-1">{detailItem.notes}</p>
              )}

              {/* Cost reveal */}
              {cpSec.enabled && cpSec.isCostHidden && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                  <Lock size={14} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-700 dark:text-purple-300 flex-1">Cost price and margin are protected</span>
                  <Button variant="secondary" size="sm" onClick={() => setCpPinModalOpen(true)}>Enter PIN</Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => { handleDelete(detailItem); }}>Delete</Button>}
                {canEdit && <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { setDetailItem(null); openEditForm(detailItem); }}>Edit</Button>}
                <Button variant="ghost" size="sm" onClick={() => setDetailItem(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Add / Edit Part Modal ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit Part' : 'Add Part'} size="lg">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleFormSave(); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Part Name *" value={form.partName} onChange={e => setForm({ ...form, partName: e.target.value })} placeholder="e.g. Rack End Assy" />
            <Input label="Part / OEM Number" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} placeholder="e.g. AK-2045" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Brand *" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Autokoi" />
            <Input label="Category *" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Steering Parts" />
            <Input label="Sub-Category" value={form.subCategory ?? ''} onChange={e => setForm({ ...form, subCategory: e.target.value })} placeholder="optional" />
          </div>

          {/* Vehicle compatibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Compatible Vehicles</label>
            {form.vehicleCompatibility.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.vehicleCompatibility.map(v => (
                  <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    {v}
                    <button type="button" onClick={() => removeVehicle(v)} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={vehicleInput}
                onChange={e => setVehicleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVehicle(); } }}
                placeholder="Type vehicle name & press Enter"
                className="flex-1 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <Button variant="secondary" size="sm" type="button" onClick={addVehicle}>Add</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="MRP (₹) *" type="number" value={form.mrp || ''} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} placeholder="0" />
            <Input label="Sell Price (₹)" type="number" value={form.sellingPrice ?? ''} onChange={e => setForm({ ...form, sellingPrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="optional" />
            {cpSec.isCostHidden ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Price (₹)</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Lock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-400 tracking-widest">••••••</span>
                </div>
              </div>
            ) : (
              <Input label="Cost Price (₹)" type="number" value={form.costPrice ?? ''} onChange={e => setForm({ ...form, costPrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="optional" />
            )}
            <Input label="Rack Location" value={form.rackLocation ?? ''} onChange={e => setForm({ ...form, rackLocation: e.target.value })} placeholder="e.g. B1-05" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Position</label>
              <div className="flex gap-1.5">
                {['', 'front', 'rear'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, position: p as CatalogueItem['position'] })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${
                      form.position === p
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {p || 'None'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Side</label>
              <div className="flex gap-1.5">
                {['', 'left', 'right', 'both'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, side: s as CatalogueItem['side'] })}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${
                      form.side === s
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {s || 'None'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input label="Notes" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes about this part" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editingId ? 'Save Changes' : 'Add Part'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Import Modal ── */}
      <ImportCatalogueModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(rows) => {
          const count = importItems(rows);
          addToast('success', `${count} part${count === 1 ? '' : 's'} imported`);
          setImportOpen(false);
        }}
      />

      {/* ── PIN Modal ── */}
      <Modal open={cpPinModalOpen} onClose={() => { setCpPinModalOpen(false); setCpPinInput(''); }} title="Reveal Cost Prices" size="sm">
        <form className="space-y-4" onSubmit={e => {
          e.preventDefault();
          if (cpSec.verifyPin(cpPinInput)) {
            cpSec.reveal(); setCpPinModalOpen(false); setCpPinInput('');
            addToast('success', 'Cost prices revealed for this session');
          } else { addToast('error', 'Incorrect PIN'); setCpPinInput(''); }
        }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400"><Lock size={24} /></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Enter admin PIN to view cost prices</p>
          </div>
          <Input label="Admin PIN" type="password" value={cpPinInput} onChange={e => setCpPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter PIN" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setCpPinModalOpen(false); setCpPinInput(''); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={cpPinInput.length < 4}>Verify & Reveal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Import Modal ──
interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Omit<CatalogueItem, 'id'>[]) => void;
}

function ImportCatalogueModal({ open, onClose, onImport }: ImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ data: Omit<CatalogueItem, 'id'>; errors: string[]; rowNum: number }[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();

  const reset = () => { setFileName(null); setParsed(null); setHeaderError(null); };

  useEffect(() => { if (!open) reset(); }, [open]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      addToast('error', 'Please upload a .csv file'); return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = String(e.target?.result ?? '');
      const { headers, rows } = parseCSV(text);
      const lower = headers.map(h => h.toLowerCase());
      const missing = IMPORT_REQUIRED.filter(h => !lower.includes(h.toLowerCase()));
      if (missing.length > 0) {
        setHeaderError(`Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`);
        setParsed([]);
        return;
      }
      setHeaderError(null);
      const idx = (h: string) => lower.indexOf(h.toLowerCase());

      const parsedRows = rows.map((cells, i) => {
        const get = (h: string) => { const k = idx(h); return k >= 0 ? (cells[k] ?? '').trim() : ''; };
        const errors: string[] = [];
        const partName = get('partName');
        const brand = get('brand');
        const category = get('category');
        const mrp = Number(get('mrp'));
        if (!partName) errors.push('partName required');
        if (!brand) errors.push('brand required');
        if (!category) errors.push('category required');
        if (isNaN(mrp) || mrp <= 0) errors.push('mrp invalid');

        const vc = get('vehicleCompatibility');
        const vehicles = vc ? vc.split('|').map(v => v.trim()).filter(Boolean) : [];
        const sp = get('sellingPrice');
        const cp = get('costPrice');

        return {
          rowNum: i + 2,
          errors,
          data: {
            partName,
            partNumber: get('partNumber'),
            brand,
            category,
            subCategory: get('subCategory') || undefined,
            vehicleCompatibility: vehicles,
            position: (['front', 'rear'].includes(get('position').toLowerCase()) ? get('position').toLowerCase() : '') as CatalogueItem['position'],
            side: (['left', 'right', 'both'].includes(get('side').toLowerCase()) ? get('side').toLowerCase() : '') as CatalogueItem['side'],
            mrp,
            sellingPrice: sp ? Number(sp) : undefined,
            costPrice: cp ? Number(cp) : undefined,
            rackLocation: get('rackLocation') || undefined,
            notes: get('notes') || undefined,
          },
        };
      });
      setParsed(parsedRows);
    };
    reader.readAsText(file);
  };

  const validRows = parsed?.filter(r => r.errors.length === 0) ?? [];
  const errorRows = parsed?.filter(r => r.errors.length > 0) ?? [];

  const downloadTemplate = () => {
    const tpl = IMPORT_ALL.join(',') + '\n' +
      'Rack End Assy,AK-2045,Autokoi,Steering Parts,,Swift|Dzire|Baleno,front,both,650,572,380,B1-05,';
    const blob = new Blob([tpl], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'catalogue-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Parts Catalogue" size="lg">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (validRows.length > 0) onImport(validRows.map(r => r.data)); }}>
        {!parsed && !headerError && (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV file. <strong>Required:</strong> partName, brand, category, mrp.
              <div className="mt-2 flex flex-wrap gap-1">
                {IMPORT_ALL.map(h => (
                  <code key={h} className={`text-[11px] rounded px-1.5 py-0.5 ${IMPORT_REQUIRED.includes(h) ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{h}{IMPORT_REQUIRED.includes(h) && ' *'}</code>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">For vehicleCompatibility, separate vehicles with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">|</code> pipe character (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Swift|Dzire|Baleno</code>)</p>
            </div>
            <button type="button" onClick={downloadTemplate} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              ↓ Download CSV template
            </button>
          </>
        )}

        {!parsed && (
          <label
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0] ?? null); }}
            className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400'
            }`}
          >
            <Upload size={32} className={dragActive ? 'text-emerald-500' : 'text-gray-400'} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{dragActive ? 'Drop to upload' : 'Drag CSV here or click to browse'}</p>
            <p className="text-xs text-gray-500">.csv · max 5 MB</p>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {headerError && (
          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Cannot parse {fileName}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{headerError}</p>
              </div>
            </div>
            <div className="mt-3"><Button variant="secondary" size="sm" type="button" onClick={reset}>Try another file</Button></div>
          </div>
        )}

        {parsed && parsed.length > 0 && !headerError && (
          <>
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{fileName}</span>
              <span className="text-gray-400">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{validRows.length} valid</span>
              {errorRows.length > 0 && (<><span className="text-gray-400">·</span><span className="text-red-700 dark:text-red-400 text-sm font-medium">{errorRows.length} errors</span></>)}
              <div className="flex-1" />
              <Button variant="ghost" size="sm" type="button" onClick={reset}>Clear</Button>
            </div>

            <div className="max-h-[300px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr className="text-gray-500">
                    <th className="text-left px-2 py-2 font-medium">#</th>
                    <th className="text-left px-2 py-2 font-medium">Status</th>
                    <th className="text-left px-2 py-2 font-medium">Part Name</th>
                    <th className="text-left px-2 py-2 font-medium">Brand</th>
                    <th className="text-left px-2 py-2 font-medium">Category</th>
                    <th className="text-right px-2 py-2 font-medium">MRP</th>
                    <th className="text-left px-2 py-2 font-medium">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {parsed.map(r => (
                    <tr key={r.rowNum} className={r.errors.length > 0 ? 'bg-red-50/40 dark:bg-red-500/5' : ''}>
                      <td className="px-2 py-1.5 text-gray-500 tabular-nums">{r.rowNum}</td>
                      <td className="px-2 py-1.5">{r.errors.length === 0 ? <Badge variant="success">OK</Badge> : <Badge variant="danger">Skip</Badge>}</td>
                      <td className="px-2 py-1.5 text-gray-900 dark:text-white font-medium truncate max-w-[160px]">{r.data.partName || <span className="text-gray-400 italic">missing</span>}</td>
                      <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{r.data.brand || '—'}</td>
                      <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{r.data.category || '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.data.mrp > 0 ? formatCurrency(r.data.mrp) : '—'}</td>
                      <td className="px-2 py-1.5 text-red-600 dark:text-red-400">{r.errors.join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">
            {parsed ? (validRows.length > 0 ? `Importing valid rows only.${errorRows.length > 0 ? ' Error rows will be skipped.' : ''}` : 'No valid rows to import.') : 'Drag-drop or browse to load a CSV file.'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!parsed || validRows.length === 0}>
              Import {validRows.length > 0 ? validRows.length : ''} {validRows.length === 1 ? 'part' : 'parts'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
