'use client';

/**
 * StarPay API Service
 * Instant virtual Mastercard/Visa cards funded with crypto
 * No KYC required - Zero-knowledge swap technology
 *
 * @see https://www.starpay.cards/api-dashboard/docs
 */

const STARPAY_API = '/api/starpay';

export type CardType = 'visa' | 'mastercard';

// StarPay API Order Statuses
// - pending: Waiting for payment
// - processing: Payment received, issuing card
// - completed: Card issued, markup credited
// - failed: Card issuance failed
// - expired: Order expired (30 min timeout)
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// GET /api/v1/cards/price response
export interface PriceResponse {
  success: boolean;
  pricing: {
    card_value: number;
    starpay_fee_percent: number;
    starpay_fee_usd: number;
    wholesale_cost: number;
    reseller_markup_percent: number;
    reseller_markup_usd: number;
    customer_price: number;
    reseller_profit: number;
  };
  reseller: string;
}

// POST /api/v1/cards/order response
export interface CardOrder {
  orderId: string;
  status: OrderStatus;
  cardType?: CardType;
  customerEmail?: string;
  expiresAt: string;
  feeTier?: string;
  checkStatusUrl?: string;
  payment: {
    address: string;
    amountSol: number;
    solPrice?: number;
  };
  pricing?: {
    cardValue: number;
    starpayFeePercent: number;
    starpayFee: number;
    resellerMarkup?: number;
    total: number;
  };
}

// GET /api/v1/cards/order/status response
export interface OrderStatusResponse {
  success?: boolean;
  orderId: string;
  status: OrderStatus;
  cardType?: CardType;
  amountUSD?: number;
  expiresAt?: string;
  message?: string; // Error message for failed orders
  payment?: {
    address: string;
    expectedSol?: number;
    receivedSol?: number;
  };
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/v1/me response
export interface AccountInfo {
  id: string;
  username: string;
  balance_usd: number;
  api_active: boolean;
  commission_percent: number;
  total_cards_issued: number;
  total_revenue_usd: number;
  status: 'active' | 'suspended';
  created_at: string;
}

// Legacy type for backwards compatibility
export interface PriceQuote {
  success: boolean;
  amount: number;
  cardType: CardType;
  cryptoAmount: number;
  cryptoCurrency: string;
  fee: number;
  feePercentage: number;
  total: number;
  rate: number;
}

class StarPayService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${STARPAY_API}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || `StarPay API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get price breakdown for a card amount
   */
  async getPrice(amount: number): Promise<PriceResponse> {
    return this.request<PriceResponse>(`/cards/price?amount=${amount}`);
  }

  /**
   * Create a new card order
   */
  async createOrder(params: {
    amount: number;
    cardType: CardType;
    email: string;
  }): Promise<CardOrder> {
    return this.request<CardOrder>('/cards/order', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Check order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    return this.request<OrderStatusResponse>(`/cards/order/status?orderId=${orderId}`);
  }

  /**
   * Get account info
   */
  async getAccountInfo(): Promise<AccountInfo> {
    return this.request<AccountInfo>('/me');
  }

  /**
   * Poll order status until completion or timeout
   */
  async pollOrderStatus(
    orderId: string,
    options: {
      interval?: number;
      timeout?: number;
      onStatusChange?: (status: OrderStatusResponse) => void;
    } = {}
  ): Promise<OrderStatusResponse> {
    const { interval = 10000, timeout = 600000, onStatusChange } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getOrderStatus(orderId);

      if (onStatusChange) {
        onStatusChange(status);
      }

      if (status.status === 'completed' || status.status === 'failed' || status.status === 'expired') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Order status polling timeout');
  }
}

export const starPayService = new StarPayService();
export { StarPayService };
