'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@/lib/privy';
import { NetworkProvider } from '@/providers/NetworkProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProvider>
      <NetworkProvider>
        {children}
      </NetworkProvider>
    </PrivyProvider>
  );
}
