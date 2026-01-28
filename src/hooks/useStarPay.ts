'use client';

/**
 * StarPay React Hook
 * Create virtual cards funded with crypto - No KYC
 */

import { useState, useCallback, useEffect } from 'react';
import {
  starPayService,
  CardType,
  PriceResponse,
  CardOrder,
  OrderStatusResponse,
  AccountInfo,
  OrderStatus,
} from '@/lib/privacy-sdks/starpay';

export interface UseStarPayReturn {
  loading: boolean;
  error: string | null;

  // Account
  accountInfo: AccountInfo | null;
  fetchAccountInfo: () => Promise<AccountInfo | null>;

  // Pricing
  priceData: PriceResponse | null;
  getPrice: (amount: number) => Promise<PriceResponse | null>;

  // Orders
  currentOrder: CardOrder | null;
  orderStatus: OrderStatusResponse | null;
  createCard: (params: { amount: number; cardType: CardType; email: string }) => Promise<CardOrder | null>;
  checkOrderStatus: (orderId: string) => Promise<OrderStatusResponse | null>;
  resumeOrder: (orderId: string) => Promise<OrderStatusResponse | null>;
  pollOrder: (orderId: string) => void;
  stopPolling: () => void;
  isPolling: boolean;

  // Utilities
  reset: () => void;
}

export function useStarPay(): UseStarPayReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [priceData, setPriceData] = useState<PriceResponse | null>(null);
  const [currentOrder, setCurrentOrder] = useState<CardOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch account info
  const fetchAccountInfo = useCallback(async (): Promise<AccountInfo | null> => {
    try {
      const info = await starPayService.getAccountInfo();
      setAccountInfo(info);
      return info;
    } catch (e: unknown) {
      console.error('Failed to fetch account info:', e);
      return null;
    }
  }, []);

  // Get price breakdown
  const getPrice = useCallback(async (amount: number): Promise<PriceResponse | null> => {
    if (amount < 5 || amount > 10000) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await starPayService.getPrice(amount);
      setPriceData(data);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get price');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create card order
  const createCard = useCallback(async (params: {
    amount: number;
    cardType: CardType;
    email: string;
  }): Promise<CardOrder | null> => {
    setLoading(true);
    setError(null);

    try {
      const order = await starPayService.createOrder(params);
      setCurrentOrder(order);
      setOrderStatus(null);
      return order;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check order status
  const checkOrderStatus = useCallback(async (orderId: string): Promise<OrderStatusResponse | null> => {
    try {
      const status = await starPayService.getOrderStatus(orderId);
      setOrderStatus(status);
      return status;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to check status');
      return null;
    }
  }, []);

  // Resume an existing order - fetches status and sets up state for payment modal
  const resumeOrder = useCallback(async (orderId: string): Promise<OrderStatusResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const status = await starPayService.getOrderStatus(orderId);
      setOrderStatus(status);

      // Create a minimal CardOrder object from the status response
      // This allows the payment modal to work with resumed orders
      const resumedOrder: CardOrder = {
        orderId: status.orderId,
        status: status.status,
        cardType: status.cardType,
        expiresAt: status.expiresAt || '',
        payment: {
          address: status.payment?.address || '',
          amountSol: status.payment?.expectedSol || 0,
        },
        pricing: status.amountUSD ? {
          cardValue: status.amountUSD,
          starpayFeePercent: 0,
          starpayFee: 0,
          total: status.amountUSD,
        } : undefined,
      };

      setCurrentOrder(resumedOrder);
      return status;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resume order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll order status
  const pollOrder = useCallback((orderId: string) => {
    if (pollingInterval) clearInterval(pollingInterval);
    setIsPolling(true);

    const poll = async () => {
      try {
        const status = await starPayService.getOrderStatus(orderId);
        setOrderStatus(status);

        // Stop on terminal states
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'expired') {
          setIsPolling(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    poll(); // Initial check
    const interval = setInterval(poll, 5000); // Poll every 5 seconds
    setPollingInterval(interval);
  }, [pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
  }, [pollingInterval]);

  // Reset state
  const reset = useCallback(() => {
    setError(null);
    setPriceData(null);
    setCurrentOrder(null);
    setOrderStatus(null);
    stopPolling();
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  return {
    loading,
    error,
    accountInfo,
    fetchAccountInfo,
    priceData,
    getPrice,
    currentOrder,
    orderStatus,
    createCard,
    checkOrderStatus,
    resumeOrder,
    pollOrder,
    stopPolling,
    isPolling,
    reset,
  };
}

export default useStarPay;
export type { CardType, PriceResponse, CardOrder, OrderStatusResponse, AccountInfo, OrderStatus };
