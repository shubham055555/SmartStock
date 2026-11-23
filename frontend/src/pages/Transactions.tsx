import React, { useState, useEffect } from 'react';
import { History, Filter, Search, ArrowDownLeft, ArrowUpRight, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StockTransaction, PaginationMeta } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const Transactions: React.FC = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    per_page: 15,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '15');
      if (typeFilter) params.append('type', typeFilter);

      const resp = await api.get(`/stock/transactions?${params.toString()}`);
      setTransactions(resp.data.data);
      setPagination(resp.data.pagination);
    } catch (err: any) {
      showToast('error', 'Error Loading Audit Logs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Transaction Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable historical record of every stock movement, balance delta, and operator attribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
          >
            <option value="">All Movement Types</option>
            <option value="IN">Stock IN (+ Inflow)</option>
            <option value="OUT">Stock OUT (- Outflow)</option>
          </select>
          <button
            onClick={() => fetchTransactions(pagination.page)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction ID / Ref</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4 text-center">Movement Qty</th>
                <th className="py-3 px-4 text-center">Post-Balance</th>
                <th className="py-3 px-4 text-right">Value Amount</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions recorded matching the selected filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">#{tx.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.reference_no || 'MANUAL'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={tx.transaction_type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.product_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{tx.product_sku}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={tx.transaction_type === 'IN' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.transaction_type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {tx.balance_after}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${tx.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {tx.user_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
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
            Total {pagination.total_items} recorded transactions
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.page} of {pagination.total_pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => fetchTransactions(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
