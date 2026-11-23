import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface StockOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
  products: Product[];
  initialProductId?: number | null;
  initialType?: 'IN' | 'OUT';
}

export const StockOperationModal: React.FC<StockOperationModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  products,
  initialProductId,
  initialType = 'IN',
}) => {
  const { showToast } = useToast();
  const [operationType, setOperationType] = useState<'IN' | 'OUT'>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOperationType(initialType);
    if (initialProductId) {
      setSelectedProductId(String(initialProductId));
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(String(products[0].id));
    }
  }, [initialProductId, initialType, isOpen, products]);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(operationType === 'IN' ? selectedProduct.cost_price : selectedProduct.unit_price);
      const prefix = operationType === 'IN' ? 'PO' : 'SO';
      setReferenceNo(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [selectedProductId, operationType]);

  const currentStock = selectedProduct ? selectedProduct.quantity : 0;
  const balanceAfter = operationType === 'IN' ? currentStock + quantity : currentStock - quantity;
  const isNegativeStockRisk = operationType === 'OUT' && quantity > currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      showToast('error', 'Validation Error', 'Please select a product and valid positive quantity.');
      return;
    }

    if (isNegativeStockRisk) {
      showToast(
        'error',
        'Insufficient Stock Violation',
        `Cannot dispatch ${quantity} units. Only ${currentStock} units available.`
      );
      return;
    }

    setLoading(true);
    try {
      const endpoint = operationType === 'IN' ? '/stock/in' : '/stock/out';
      await api.post(endpoint, {
        product_id: Number(selectedProductId),
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        reference_no: referenceNo,
        notes: notes,
      });

      showToast(
        'success',
        `Stock ${operationType} Successful`,
        `Processed ${quantity} units for ${selectedProduct?.name}. Ref: ${referenceNo}`
      );
      onCompleted();
      onClose();
    } catch (err: any) {
      showToast('error', 'Stock Operation Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Stock Movement"
      subtitle="Execute atomic Stock IN intake or Stock OUT fulfillment"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Buttons */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setOperationType('IN')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
              operationType === 'IN'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Stock IN (Intake)</span>
          </button>
          <button
            type="button"
            onClick={() => setOperationType('OUT')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
              operationType === 'OUT'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Stock OUT (Dispense)</span>
          </button>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Inventory Product *</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Available: {p.quantity} units
              </option>
            ))}
          </select>
        </div>

        {/* Live Balance Card */}
        {selectedProduct && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500">Current Stock:</span>{' '}
              <span className="font-bold text-slate-800">{currentStock} units</span>
            </div>
            <div className="font-mono text-slate-400">→</div>
            <div>
              <span className="text-slate-500">Projected Balance:</span>{' '}
              <span
                className={`font-bold ${
                  balanceAfter < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {balanceAfter} units
              </span>
            </div>
          </div>
        )}

        {/* Negative stock alert banner */}
        {isNegativeStockRisk && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Warning:</strong> Requested quantity ({quantity}) exceeds available stock ({currentStock}).
              Database check constraints will reject this transaction.
            </span>
          </div>
        )}

        {/* Quantity and Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Valuation (${operationType === 'IN' ? 'Cost' : 'Selling'})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>
        </div>

        {/* Reference & Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / PO / SO Number</label>
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            placeholder="e.g. PO-89212"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Reason, destination warehouse or customer name"
          />
        </div>

        {/* Action Buttons */}
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
            disabled={loading || isNegativeStockRisk}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm disabled:opacity-50 ${
              operationType === 'IN'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
            }`}
          >
            {loading ? 'Processing Ledger...' : `Confirm Stock ${operationType}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
