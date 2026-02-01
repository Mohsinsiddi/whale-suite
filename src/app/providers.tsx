'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@/lib/privy';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { ToastProvider } from '@/components/ui/Toast';
import AppWrapper from '@/components/layout/AppWrapper';
import NavigationLoader from '@/components/ui/NavigationLoader';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProvider>
      <NetworkProvider>
        <ToastProvider>
          <AppWrapper>
            {/* Navigation loader - shows when switching pages */}
            <NavigationLoader />
            {children}
          </AppWrapper>
        </ToastProvider>
      </NetworkProvider>
    </PrivyProvider>
  );
}
