import React, { useState, useEffect } from 'react';
import { FolderTree, Truck, Plus, Edit2, Trash2, Mail, Phone, MapPin, Tag } from 'lucide-react';
import { api } from '../services/api';
import { Category, Supplier } from '../types';
import { CategoryModal } from '../components/modals/CategoryModal';
import { SupplierModal } from '../components/modals/SupplierModal';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SuppliersCategories: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'categories' | 'suppliers'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [deletingItem, setDeletingItem] = useState<{ id: number; type: 'cat' | 'sup'; name: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catResp, supResp] = await Promise.all([
        api.get('/categories?with_counts=true'),
        api.get('/suppliers?with_counts=true'),
      ]);
      setCategories(catResp.data.data);
      setSuppliers(supResp.data.data);
    } catch (err: any) {
      showToast('error', 'Failed to load metadata', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'cat' ? `/categories/${deletingItem.id}` : `/suppliers/${deletingItem.id}`;
      await api.delete(endpoint);
      showToast('success', 'Item Deleted', `Removed ${deletingItem.name}`);
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Taxonomy Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure component categories, procurement partners, and vendor contact registries
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'categories' ? (
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCatModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setIsSupModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Suppliers ({suppliers.length})</span>
        </button>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-brand-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {c.product_count ?? 0} SKUs
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setEditingCategory(c);
                    setIsCatModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setDeletingItem({ id: c.id, type: 'cat', name: c.name })}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suppliers View */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {s.product_count ?? 0} Supplied SKUs
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                {s.contact_name && (
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">Contact: {s.contact_name}</p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setEditingSupplier(s);
                    setIsSupModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setDeletingItem({ id: s.id, type: 'sup', name: s.name })}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSaved={fetchData}
        category={editingCategory}
      />

      <SupplierModal
        isOpen={isSupModalOpen}
        onClose={() => setIsSupModalOpen(false)}
        onSaved={fetchData}
        supplier={editingSupplier}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDeletingItem(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
