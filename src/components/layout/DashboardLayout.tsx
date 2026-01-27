"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/privy/hooks";
import { useWalletChange } from "@/hooks/useWalletChange";
import { useUI } from "@/store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { ready, authenticated, walletAddress, isLoading } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUI();

  // Handle wallet changes (only if authenticated)
  useWalletChange();

  // Show loading while Privy initializes
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        {/* Skeleton Header */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-bg-secondary border-b border-border-primary z-50">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bg-elevated animate-pulse" />
              <div className="hidden md:block w-24 h-4 bg-bg-elevated rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-8 bg-bg-elevated rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-bg-elevated rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Sidebar (Desktop) */}
        <div className="hidden lg:block fixed left-0 top-14 w-64 h-[calc(100vh-56px)] bg-bg-secondary border-r border-border-primary">
          <div className="p-4 space-y-4">
            {/* User Card Skeleton */}
            <div className="p-3 rounded-xl bg-bg-tertiary animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-elevated" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-bg-elevated rounded" />
                  <div className="w-16 h-3 bg-bg-elevated rounded" />
                </div>
              </div>
            </div>
            {/* Nav Items Skeleton */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="w-4 h-4 bg-bg-elevated rounded animate-pulse" />
                <div className="w-24 h-4 bg-bg-elevated rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Loading */}
        <main className="lg:pl-64 pt-14">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-neon-green/30 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm text-text-muted">Initializing Whale Suite...</p>
              <div className="flex items-center gap-2 text-xs text-text-muted/60">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render dashboard for both authenticated and unauthenticated users
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <Header
        variant="app"
        wallet={walletAddress || undefined}
        notifications={authenticated ? 3 : 0}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:pl-64 pt-14">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
