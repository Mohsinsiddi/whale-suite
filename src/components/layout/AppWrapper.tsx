"use client";

import { useState, useEffect, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if this is a fresh page load or navigation
    const hasLoadedBefore = sessionStorage.getItem('whale-suite-loaded');

    if (hasLoadedBefore) {
      // Skip loading screen for subsequent navigations
      setIsLoading(false);
    }
  }, []);

  const handleLoadComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem('whale-suite-loaded', 'true');
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading-screen"
            minDuration={1500}
            onLoadComplete={handleLoadComplete}
          />
        )}
      </AnimatePresence>

      {!isLoading && children}
    </>
  );
}
