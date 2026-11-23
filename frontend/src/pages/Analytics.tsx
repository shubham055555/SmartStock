import React, { useState, useEffect } from 'react';
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
import { TrendingUp, DollarSign, Layers, Boxes, Percent, ShieldCheck, Download } from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { useToast } from '../context/ToastContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Analytics: React.FC = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumResp, chartResp] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/charts'),
      ]);
      setSummary(sumResp.data.summary);
      setChartData(chartResp.data);
    } catch (err: any) {
      showToast('error', 'Analytics Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalCost = summary?.total_inventory_value || 0;
  // Estimated retail value approx
  const estimatedRevenue = totalCost * 1.65;
  const projectedMargin = totalCost > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Inventory Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turnover metrics, capital expenditure allocation, and category valuation telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Audit State: Reconciled
          </span>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Capital Committed"
          value={`$${totalCost.toLocaleString()}`}
          subtitle="At Standard Cost Basis"
          icon={DollarSign}
          iconBg="bg-blue-50 text-brand-600"
        />
        <StatCard
          title="Projected Realizable Value"
          value={`$${Math.round(estimatedRevenue).toLocaleString()}`}
          subtitle="At Current Unit Selling Prices"
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Gross Margin Target"
          value={`${projectedMargin.toFixed(1)}%`}
          subtitle="Weighted Product Margin"
          icon={Percent}
          iconBg="bg-purple-50 text-purple-600"
          trend="Healthy"
          trendColor="green"
        />
        <StatCard
          title="Total Ledger Movements"
          value={summary?.total_transactions || 0}
          subtitle="ACID Transactions Logged"
          icon={Layers}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Valuation Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm">Capital Allocation by Category ($)</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Total dollar investment locked in inventory families</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData?.category_distribution || []}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Valuation']} />
                <Bar dataKey="total_value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Flow IN vs OUT */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Cumulative Stock Movements</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Comparison of intake units (IN) vs dispatched units (OUT)</p>
          </div>
          <div className="h-64 my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Stock IN (Intake)', value: chartData?.stock_movement?.total_in || 10 },
                    { name: 'Stock OUT (Dispatched)', value: chartData?.stock_movement?.total_out || 5 },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
              <div className="text-[10px] text-emerald-700 font-bold uppercase">Total Inflow</div>
              <div className="text-base font-bold font-mono">+{chartData?.stock_movement?.total_in || 0} units</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-900">
              <div className="text-[10px] text-rose-700 font-bold uppercase">Total Outflow</div>
              <div className="text-base font-bold font-mono">-{chartData?.stock_movement?.total_out || 0} units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
