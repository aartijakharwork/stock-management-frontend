import { useMemo, useState } from 'react';
import { FolderOpen, Pencil, Plus, Trash2, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useShopCatalog } from '../../context/ShopCatalogContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';

/** Product categories editor — used inside Settings (not a standalone route). */
export function SettingsCategoriesPanel() {
  const { items, categories, addCategory, renameCategory, removeCategory } = useShopCatalog();
  const { addToast } = useToast();
  const { can } = usePermissions();
  const canEdit = can('inventory', 'edit');
  const canDelete = can('inventory', 'delete');

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const countsByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) {
      m.set(i.category, (m.get(i.category) ?? 0) + 1);
    }
    return m;
  }, [items]);

  const handleAdd = () => {
    if (!addCategory(newName)) {
      addToast('warning', 'Category exists', 'Use a different name.');
      return;
    }
    addToast('success', 'Category added', newName.trim());
    setNewName('');
    setAddOpen(false);
  };

  const openEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleRename = async () => {
    if (!editingId) return;
    const r = await renameCategory(editingId, editName);
    if (!r.ok) {
      if (r.error) {
        addToast('error', 'Could not rename category', r.error);
      } else {
        addToast('error', 'Could not rename', 'Name may already exist or is unchanged.');
      }
      return;
    }
    addToast('success', 'Category updated');
    setEditingId(null);
  };

  const handleRemove = (id: string, name: string) => {
    const count = countsByName.get(name) ?? 0;
    if (count > 0) {
      addToast('error', 'Category in use', `Move or delete ${count} item${count === 1 ? '' : 's'} first.`);
      return;
    }
    if (!removeCategory(id)) {
      addToast('error', 'Could not remove category');
      return;
    }
    addToast('success', 'Category removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product categories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Names used when you add or group inventory items. Rename a category to update all products in it.
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Add category
          </Button>
        )}
      </div>

      <Card>
        {categories.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="No categories yet"
            description="Add a category, then pick it when you create items in Inventory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Items</th>
                  <th className="pb-3 w-32 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {categories.map(cat => {
                  const n = countsByName.get(cat.name) ?? 0;
                  return (
                    <tr key={cat.id} className="text-gray-900 dark:text-gray-100">
                      <td className="py-3 pr-4 font-medium">{cat.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={n > 0 ? 'info' : 'neutral'}>
                          <span className="inline-flex items-center gap-1">
                            <Package size={12} />
                            {n} item{n === 1 ? '' : 's'}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(cat.id, cat.name)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              aria-label={`Rename ${cat.name}`}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleRemove(cat.id, cat.name)}
                              disabled={n > 0}
                              title={n > 0 ? 'Remove items or reassign category first' : 'Delete category'}
                              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:pointer-events-none"
                              aria-label={`Delete ${cat.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New category">
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <Input
            label="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Lubricants"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!newName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Rename category">
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            void handleRename();
          }}
        >
          <Input
            label="New name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!editName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
