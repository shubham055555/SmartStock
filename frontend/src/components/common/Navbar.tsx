import React from 'react';
import { LogOut, User as UserIcon, Bell, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Overview' }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Production Release Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-medium text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Production Release v1.0</span>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.username}</p>
              <div className="mt-0.5">
                <Badge variant={user?.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'} />
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
