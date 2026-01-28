'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@/lib/privy';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { ToastProvider } from '@/components/ui/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProvider>
      <NetworkProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </NetworkProvider>
    </PrivyProvider>
  );
}
