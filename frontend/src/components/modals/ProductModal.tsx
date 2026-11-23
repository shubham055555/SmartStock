import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Product, Category, Supplier } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  product,
  categories,
  suppliers,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: 0,
    unit_price: 0,
    quantity: 0,
    reorder_level: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: product.description || '',
        category_id: String(product.category_id),
        supplier_id: product.supplier_id ? String(product.supplier_id) : '',
        cost_price: product.cost_price,
        unit_price: product.unit_price,
        quantity: product.quantity,
        reorder_level: product.reorder_level,
      });
    } else {
      setFormData({
        sku: `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        name: '',
        description: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        supplier_id: suppliers.length > 0 ? String(suppliers[0].id) : '',
        cost_price: 10.0,
        unit_price: 18.0,
        quantity: 50,
        reorder_level: 15,
      });
    }
  }, [product, isOpen, categories, suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim() || !formData.category_id) {
      showToast('error', 'Validation Error', 'SKU, Name, and Category are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        cost_price: Number(formData.cost_price),
        unit_price: Number(formData.unit_price),
        quantity: Number(formData.quantity),
        reorder_level: Number(formData.reorder_level),
      };

      if (product) {
        await api.put(`/products/${product.id}`, payload);
        showToast('success', 'Product Updated', `Successfully updated ${formData.name}`);
      } else {
        await api.post('/products', payload);
        showToast('success', 'Product Created', `Added ${formData.name} to inventory catalogue.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast('error', 'Failed to save product', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Inventory Product'}
      subtitle={product ? `Editing SKU ${product.sku}` : 'Register a new stock keeping unit'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Identifier *</label>
            <input
              type="text"
              required
              disabled={!!product}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono disabled:bg-slate-100"
              placeholder="SKU-XXX-000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode (EAN/UPC)</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              placeholder="Barcode digits"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. ESP32-S3 Microcontroller"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">None (In-House)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Qty</label>
            <input
              type="number"
              min="0"
              disabled={!!product}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
            <input
              type="number"
              min="0"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Specifications</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Technical specs, dimensions, manufacturer part numbers..."
          />
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Add to Catalogue'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
