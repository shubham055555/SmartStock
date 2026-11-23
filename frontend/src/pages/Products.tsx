import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Download,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category, Supplier, PaginationMeta } from '../types';
import { Badge } from '../components/common/Badge';
import { ProductModal } from '../components/modals/ProductModal';
import { StockOperationModal } from '../components/modals/StockOperationModal';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Products: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockOpTarget, setStockOpTarget] = useState<{ id: number; type: 'IN' | 'OUT' } | null>(null);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchAuxiliaryData = async () => {
    try {
      const [catResp, supResp] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      setCategories(catResp.data.data);
      setSuppliers(supResp.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '10');
      if (search) params.append('q', search);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedStockStatus) params.append('stock_status', selectedStockStatus);

      const resp = await api.get(`/products?${params.toString()}`);
      setProducts(resp.data.data);
      setPagination(resp.data.pagination);
    } catch (err: any) {
      showToast('error', 'Error Loading Inventory', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [search, selectedCategory, selectedStockStatus]);

  const handleExportCSV = async () => {
    try {
      const resp = await api.get('/products/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smartstock_inventory_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', 'CSV Export Complete', 'Downloaded comprehensive inventory report.');
    } catch (err: any) {
      showToast('error', 'CSV Export Failed', err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      showToast('success', 'Product Deleted', `Removed ${deletingProduct.name} from database.`);
      setDeletingProduct(null);
      fetchProducts(pagination.page);
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  const openStockModal = (productId: number, type: 'IN' | 'OUT') => {
    setStockOpTarget({ id: productId, type });
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product & SKU Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product identifiers, categories, automated reorder thresholds, and barcodes
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, name, or barcode..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (Healthy)</option>
            <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
            <option value="OUT_OF_STOCK">Out of Stock (Zero)</option>
          </select>

          <button
            onClick={() => fetchProducts(pagination.page)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Identifier / SKU</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Cost / Selling</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-right">Total Valuation</th>
                <th className="py-3 px-4 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{p.sku}</div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                        <Barcode className="w-3 h-3" />
                        <span>{p.barcode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{p.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.category_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.supplier_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="text-slate-500 text-[11px]">Cost: ${p.cost_price.toFixed(2)}</div>
                      <div className="text-slate-900 font-bold">${p.unit_price.toFixed(2)}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={p.stock_status} label={`${p.quantity} units`} />
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Reorder at {p.reorder_level}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      ${p.total_value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openStockModal(p.id, 'IN')}
                          title="Stock IN Intake"
                          className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openStockModal(p.id, 'OUT')}
                          disabled={p.quantity === 0}
                          title="Stock OUT Dispense"
                          className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-40"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingProduct(p)}
                            title="Delete Product (Admin Only)"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>
            Showing {products.length} of {pagination.total_items} registered SKUs
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchProducts(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.page} of {pagination.total_pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => fetchProducts(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={() => fetchProducts(pagination.page)}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Stock IN / OUT Operation Modal */}
      <StockOperationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onCompleted={() => fetchProducts(pagination.page)}
        products={products}
        initialProductId={stockOpTarget?.id}
        initialType={stockOpTarget?.type}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Confirm SKU Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently delete <strong>{deletingProduct?.name}</strong> (SKU:{' '}
            {deletingProduct?.sku})? All associated stock records and historical data will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDeletingProduct(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProduct}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
