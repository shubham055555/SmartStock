import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowUpDown,
  History,
  FolderTree,
  BarChart3,
  Terminal,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products & Inventory', path: '/products', icon: Boxes },
    { name: 'Stock IN / OUT', path: '/stock-ops', icon: ArrowUpDown },
    { name: 'Transaction History', path: '/transactions', icon: History },
    { name: 'Categories & Suppliers', path: '/management', icon: FolderTree },
    { name: 'Analytics & Trends', path: '/analytics', icon: BarChart3 },
    { name: 'AI DevOps Center', path: '/devops', icon: Terminal, badge: 'AI & Ops' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-tight">SmartStock</h1>
          <p className="text-[10px] text-brand-400 font-mono tracking-wider uppercase font-semibold">DevOps & Lab Capstone</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Inventory System</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Cluster Status: Healthy</span>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-2.5 text-[11px] text-slate-400 border border-slate-700/50">
          <div className="flex justify-between items-center text-slate-300 font-mono">
            <span>Role:</span>
            <span className="text-brand-400 font-bold">{user?.role}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 font-mono mt-1">
            <span>Course:</span>
            <span>ENSP461</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
