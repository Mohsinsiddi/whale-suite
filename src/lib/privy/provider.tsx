'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { privyConfig, PRIVY_APP_ID } from './config';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  // Only render with valid app ID
  if (!PRIVY_APP_ID || PRIVY_APP_ID === 'your_privy_app_id') {
    // Return children without Privy wrapper for local development
    console.warn('Privy App ID not configured. Authentication disabled.');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase appId={PRIVY_APP_ID} config={privyConfig}>
      {children}
    </PrivyProviderBase>
  );
}

export default PrivyProvider;
