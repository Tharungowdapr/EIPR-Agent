'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderOpen, Plus, Settings, LogOut,
  Menu, X, User, BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/ip-guide', label: 'IP Guide', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
          E
        </div>
        <span className="font-semibold text-[var(--text-primary)]">EIPR-Agent</span>
        <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-[var(--text-muted)]">
          <X size={20} />
        </button>
      </div>

      <div className="px-3 py-3">
        <Link
          href="/projects/new"
          className="btn-primary w-full justify-center text-xs"
          onClick={() => setMobileOpen(false)}
        >
          <Plus size={14} />
          New Analysis
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Main</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={clsx('sidebar-item', pathname.startsWith(href) && 'active')}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}


      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-1">
        <Link
          href="/settings/llm"
          onClick={() => setMobileOpen(false)}
          className="sidebar-item w-full"
        >
          <Settings size={16} />
          AI Settings
        </Link>
        <Link
          href="/settings/profile"
          onClick={() => setMobileOpen(false)}
          className="sidebar-item w-full"
        >
          <User size={16} />
          Profile
        </Link>
        <Link
          href="/settings/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--bg-hover)] transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 text-xs font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
        </Link>
        <div className="px-2 pt-1">
          <button onClick={handleLogout} className="sidebar-item w-full text-red-400 hover:text-red-300">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed left-0 top-0 h-screen w-64 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col z-50 transition-transform duration-200',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}