"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/privy/hooks";
import { useWalletChange } from "@/hooks/useWalletChange";
import { useUI } from "@/store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { ready, authenticated, walletAddress, isLoading } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUI();

  // Handle wallet changes (critical for data refresh)
  useWalletChange();

  // Redirect to connect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/connect");
    }
  }, [ready, authenticated, router]);

  // Show loading while checking auth
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <Header
        variant="app"
        wallet={walletAddress || undefined}
        notifications={3}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 left-4 z-40 lg:hidden p-3 rounded-full bg-neon-green text-bg-primary shadow-glow-md"
      >
        <MenuIcon />
      </button>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
