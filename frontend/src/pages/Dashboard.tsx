import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Layers,
  DollarSign,
  AlertTriangle,
  PackageX,
  ArrowUpDown,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Product, SummaryStats, StockTransaction } from '../types';
import { StockOperationModal } from '../components/modals/StockOperationModal';
import { useToast } from '../context/ToastContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Stock Operation Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumResp, chartResp, lowResp, txResp, prodResp] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/charts'),
        api.get('/products/low-stock'),
        api.get('/stock/transactions?per_page=6'),
        api.get('/products?per_page=100'),
      ]);

      setSummary(sumResp.data.summary);
      setChartData(chartResp.data);
      setLowStockProducts(lowResp.data.data);
      setRecentTransactions(txResp.data.data);
      setAllProducts(prodResp.data.data);
    } catch (err: any) {
      showToast('error', 'Dashboard Load Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openReplenishModal = (productId: number) => {
    setTargetProduct(productId);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SmartStock Inventory Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ledger analytics, concurrency-monitored inventory status & replenishment pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
          <button
            onClick={() => {
              setTargetProduct(null);
              setIsStockModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Stock Movement (+/-)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Catalog SKUs"
          value={summary?.total_products ?? '—'}
          subtitle={`${summary?.total_categories ?? 0} Active Categories`}
          icon={Boxes}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Stock Units"
          value={summary?.total_stock_units ? summary.total_stock_units.toLocaleString() : '—'}
          subtitle="Physical On-Hand Quantity"
          icon={Layers}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Inventory Valuation"
          value={summary?.total_inventory_value ? `$${summary.total_inventory_value.toLocaleString()}` : '$0.00'}
          subtitle="At Standard Cost Basis"
          icon={DollarSign}
          iconBg="bg-emerald-50 text-emerald-600"
          trend="+4.2%"
          trendColor="green"
        />
        <StatCard
          title="Low & Zero Stock Alert"
          value={summary ? summary.low_stock_count + summary.out_of_stock_count : '—'}
          subtitle={`${summary?.out_of_stock_count ?? 0} Critically Depleted`}
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
          trend={summary?.out_of_stock_count ? 'Action Needed' : 'Healthy'}
          trendColor={summary?.out_of_stock_count ? 'red' : 'green'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Share Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Category Valuation Split</h3>
            <p className="text-xs text-slate-500 mt-0.5">Asset distribution across product families</p>
          </div>
          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="total_value"
                >
                  {(chartData?.category_distribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Valuation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {(chartData?.category_distribution || []).slice(0, 4).map((c: any, i: number) => (
              <div key={c.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></span>
                  {c.name}
                </span>
                <span className="font-bold text-slate-800">${Number(c.total_value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Valuation SKUs Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Top 5 Inventory Assets by Total Value</h3>
            <p className="text-xs text-slate-500 mt-0.5">Highest value capital commitments currently in stock</p>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData?.top_value_products || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Valuation']}
                />
                <Bar dataKey="total_value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500 flex justify-between items-center pt-3 border-t border-slate-100">
            <span>Calculated via (Quantity × Unit Cost Price)</span>
            <span className="text-brand-600 font-semibold flex items-center gap-1">
              Live Stock Telemetry <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Low Stock Warning + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Low Stock Alert Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Threshold Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Items needing immediate procurement purchase orders</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {lowStockProducts.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                All inventory items are currently above safe reorder levels.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">SKU / Product</th>
                    <th className="pb-2 text-center">Available</th>
                    <th className="pb-2 text-center">Reorder Lvl</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.sku}</div>
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge variant={p.stock_status} label={`${p.quantity} units`} />
                      </td>
                      <td className="py-2.5 text-center text-slate-500 font-mono">
                        {p.reorder_level}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => openReplenishModal(p.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          + Replenish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Transactions Activity Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Real-Time Transaction Stream</h3>
              <p className="text-xs text-slate-500 mt-0.5">Immutable audit log entries recorded by database triggers</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Audit Active</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Badge variant={tx.transaction_type} />
                  <div>
                    <div className="font-bold text-slate-800">{tx.product_name}</div>
                    <div className="text-[10px] text-slate-400">
                      Ref: <span className="font-mono text-slate-600">{tx.reference_no || 'MANUAL'}</span> • By{' '}
                      <span className="font-semibold text-slate-600">{tx.user_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 font-mono">
                    {tx.transaction_type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`} units
                  </div>
                  <div className="text-[10px] text-slate-400">Balance: {tx.balance_after}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Operation Modal */}
      <StockOperationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onCompleted={fetchDashboardData}
        products={allProducts}
        initialProductId={targetProduct}
        initialType="IN"
      />
    </div>
  );
};
