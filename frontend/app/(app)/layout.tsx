'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem('eipr-auth-storage');
      if (!stored || !JSON.parse(stored).state?.token) {
        router.replace('/auth/login');
      }
    } catch {
      router.replace('/auth/login');
    }
  }, [mounted, router]);

  if (!mounted) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-brand-400" />
    </div>
  );
  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="md:ml-64 min-h-screen overflow-auto p-4 md:p-8">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
