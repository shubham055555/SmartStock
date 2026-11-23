import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, Clock, Hash } from 'lucide-react';
import { api } from '../services/api';
import { Product, StockTransaction } from '../types';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const StockOperations: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [inProduct, setInProduct] = useState('');
  const [inQty, setInQty] = useState(10);
  const [inPrice, setInPrice] = useState(0);
  const [inRef, setInRef] = useState(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
  const [inNotes, setInNotes] = useState('Standard vendor delivery intake');

  const [outProduct, setOutProduct] = useState('');
  const [outQty, setOutQty] = useState(5);
  const [outPrice, setOutPrice] = useState(0);
  const [outRef, setOutRef] = useState(`SO-${Math.floor(100000 + Math.random() * 900000)}`);
  const [outNotes, setOutNotes] = useState('Order fulfillment checkout');

  const fetchData = async () => {
    try {
      const [prodResp, txResp] = await Promise.all([
        api.get('/products?per_page=100'),
        api.get('/stock/transactions?per_page=8'),
      ]);
      setProducts(prodResp.data.data);
      setRecentTransactions(txResp.data.data);

      if (prodResp.data.data.length > 0) {
        if (!inProduct) {
          setInProduct(String(prodResp.data.data[0].id));
          setInPrice(prodResp.data.data[0].cost_price);
        }
        if (!outProduct) {
          setOutProduct(String(prodResp.data.data[0].id));
          setOutPrice(prodResp.data.data[0].unit_price);
        }
      }
    } catch (err: any) {
      showToast('error', 'Failed to load stock data', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedInItem = products.find((p) => p.id === Number(inProduct));
  const selectedOutItem = products.find((p) => p.id === Number(outProduct));

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inProduct || inQty <= 0) return;

    setLoading(true);
    try {
      await api.post('/stock/in', {
        product_id: Number(inProduct),
        quantity: Number(inQty),
        unit_price: Number(inPrice),
        reference_no: inRef,
        notes: inNotes,
      });

      showToast('success', 'Stock IN Processed', `Added ${inQty} units to ${selectedInItem?.name}.`);
      setInRef(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Stock IN Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outProduct || outQty <= 0) return;

    if (selectedOutItem && outQty > selectedOutItem.quantity) {
      showToast(
        'error',
        'Insufficient Stock Violation',
        `Cannot dispatch ${outQty} units. Only ${selectedOutItem.quantity} units in stock.`
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock/out', {
        product_id: Number(outProduct),
        quantity: Number(outQty),
        unit_price: Number(outPrice),
        reference_no: outRef,
        notes: outNotes,
      });

      showToast('success', 'Stock OUT Processed', `Dispensed ${outQty} units from ${selectedOutItem?.name}.`);
      setOutRef(`SO-${Math.floor(100000 + Math.random() * 900000)}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Stock OUT Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Movement & Ledger Terminal</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute atomic Stock IN replenishment or Stock OUT fulfillment with ACID transactional integrity
        </p>
      </div>

      {/* Main 2-Panel Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock IN Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Stock IN — Warehouse Intake</h2>
                  <p className="text-xs text-slate-400">Receive purchased materials into ledger</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                + LEDGER CREDIT
              </span>
            </div>

            <form onSubmit={handleStockIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product *</label>
                <select
                  value={inProduct}
                  onChange={(e) => {
                    setInProduct(e.target.value);
                    const prod = products.find((p) => p.id === Number(e.target.value));
                    if (prod) setInPrice(prod.cost_price);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — In Stock: {p.quantity} units
                    </option>
                  ))}
                </select>
              </div>

              {selectedInItem && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-emerald-800">Current Balance:</span>{' '}
                    <strong className="text-emerald-950">{selectedInItem.quantity} units</strong>
                  </div>
                  <div>
                    <span className="text-emerald-800">Projected Balance:</span>{' '}
                    <strong className="text-emerald-700 font-mono text-sm">
                      {selectedInItem.quantity + (inQty || 0)} units
                    </strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inQty}
                    onChange={(e) => setInQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inPrice}
                    onChange={(e) => setInPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Order (PO) Reference</label>
                <input
                  type="text"
                  value={inRef}
                  onChange={(e) => setInRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Remarks</label>
                <input
                  type="text"
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Committing Transaction...' : 'Execute Stock IN Intake'}
              </button>
            </form>
          </div>
        </div>

        {/* Stock OUT Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Stock OUT — Order Fulfillment</h2>
                  <p className="text-xs text-slate-400">Dispense products to clients or internal labs</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                - LEDGER DEBIT
              </span>
            </div>

            <form onSubmit={handleStockOut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product *</label>
                <select
                  value={outProduct}
                  onChange={(e) => {
                    setOutProduct(e.target.value);
                    const prod = products.find((p) => p.id === Number(e.target.value));
                    if (prod) setOutPrice(prod.unit_price);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.quantity} units
                    </option>
                  ))}
                </select>
              </div>

              {selectedOutItem && (
                <div
                  className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                    outQty > selectedOutItem.quantity
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <span>Available:</span> <strong>{selectedOutItem.quantity} units</strong>
                  </div>
                  <div>
                    <span>Remaining Balance:</span>{' '}
                    <strong
                      className={`font-mono text-sm ${
                        outQty > selectedOutItem.quantity ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {selectedOutItem.quantity - (outQty || 0)} units
                    </strong>
                  </div>
                </div>
              )}

              {selectedOutItem && outQty > selectedOutItem.quantity && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-100 text-rose-900 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Negative inventory blocked! Requested amount exceeds on-hand balance.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dispense Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={outQty}
                    onChange={(e) => setOutQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={outPrice}
                    onChange={(e) => setOutPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Order (SO) Reference</label>
                <input
                  type="text"
                  value={outRef}
                  onChange={(e) => setOutRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Remarks</label>
                <input
                  type="text"
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || (selectedOutItem ? outQty > selectedOutItem.quantity : false)}
                className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Committing Transaction...' : 'Execute Stock OUT Dispense'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Latest Operational Audit Log</h3>
        <div className="divide-y divide-slate-100">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Badge variant={tx.transaction_type} />
                <div>
                  <div className="font-bold text-slate-800">{tx.product_name}</div>
                  <div className="text-[10px] text-slate-400">
                    Ref: <span className="font-mono text-slate-600">{tx.reference_no}</span> • User:{' '}
                    <span className="font-semibold text-slate-600">{tx.user_name}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900">
                  {tx.transaction_type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`} units
                </span>
                <div className="text-[10px] text-slate-400">Ledger Balance: {tx.balance_after}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
