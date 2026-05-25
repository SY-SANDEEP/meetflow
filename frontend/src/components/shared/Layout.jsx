import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label, end = false }) => (
  <NavLink to={to} end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
       ${isActive
         ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
         : 'text-slate-400 hover:text-slate-100 hover:bg-surface-hover'}`
    }>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

const userNav = [
  { to: '/dashboard',          icon: '⊞',  label: 'Dashboard',    end: true },
  { to: '/dashboard/slots',    icon: '📅', label: 'Browse Slots' },
  { to: '/dashboard/meetings', icon: '🤝', label: 'My Meetings'  },
  { to: '/dashboard/profile',  icon: '👤', label: 'Profile'      },
];

const adminNav = [
  { to: '/admin',               icon: '⊞',  label: 'Overview',      end: true },
  { to: '/admin/slots',         icon: '📅', label: 'Manage Slots'  },
  { to: '/admin/meetings',      icon: '🤝', label: 'All Meetings'  },
  { to: '/admin/users',         icon: '👥', label: 'Users'         },
  { to: '/dashboard/slots',     icon: '🔍', label: 'View as User'  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? adminNav : userNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-5'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/30">M</div>
        <div>
          <span className="font-bold text-slate-100 text-base">MeetFlow</span>
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium ${isAdmin ? 'bg-amber-500/15 text-amber-400' : 'bg-brand-500/15 text-brand-400'}`}>
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {nav.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* User profile strip */}
      <div className="mt-6 pt-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <span>🚪</span> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-card border-r border-surface-border flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface-card border-r border-surface-border">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-surface-card border-b border-surface-border flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-hover">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Online
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
