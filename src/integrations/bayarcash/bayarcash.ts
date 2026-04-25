// BayarCash API Integration Service
// Based on BayarCash API v3 documentation

export interface BayarCashConfig {
  apiToken: string;
  apiSecretKey: string;
  portalKey: string;
  isSandbox?: boolean;
}

export interface PaymentIntentData {
  portal_key: string;
  order_number: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_telephone_number: string;
  callback_url: string;
  return_url: string;
  payment_channel: string;
  checksum?: string;
}

export interface PaymentIntentResponse {
  url?: string;
  payment_intent_id?: string;
  status?: string;
  error?: string;
}

export interface TransactionDetails {
  payment_intent_id: string;
  order_number: string;
  amount: number;
  status: string;
  payment_channel: string;
  payer_name: string;
  payer_email: string;
  created_at: string;
}

class BayarCashService {
  private config: BayarCashConfig;
  private baseUrl: string;

  constructor(config: BayarCashConfig) {
    this.config = config;
    this.baseUrl = config.isSandbox 
      ? 'https://sandbox.bayar.cash/api/v3' 
      : 'https://api.bayar.cash/api/v3';
  }

  /**
   * Generate checksum for payment intent
   * Based on BayarCash checksum algorithm
   */
  private generateChecksum(data: Omit<PaymentIntentData, 'checksum'>): string {
    const secretKey = this.config.apiSecretKey;
    
    // Sort the data alphabetically by key
    const sortedKeys = Object.keys(data).sort();
    
    // Create string to hash
    const stringToHash = sortedKeys
      .map(key => `${key}=${data[key as keyof PaymentIntentData]}`)
      .join('&') + secretKey;
    
    // Create MD5 hash (simplified - in production use crypto-js or similar)
    return this.md5(stringToHash);
  }

  /**
   * Simple MD5 implementation (for demo purposes)
   * In production, use a proper crypto library like crypto-js
   */
  private md5(string: string): string {
    // This is a placeholder - in production use crypto-js or Web Crypto API
    // For now, we'll use a simple hash function
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(data: Omit<PaymentIntentData, 'checksum' | 'portal_key'>): Promise<PaymentIntentResponse> {
    try {
      const paymentData: PaymentIntentData = {
        ...data,
        portal_key: this.config.portalKey,
      };

      // Generate checksum
      paymentData.checksum = this.generateChecksum(paymentData);

      // Make API request
      const response = await fetch(`${this.baseUrl}/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      return {
        url: result.url,
        payment_intent_id: result.payment_intent_id,
        status: result.status,
      };
    } catch (error) {
      console.error('BayarCash API Error:', error);
      throw error;
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<TransactionDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-intent/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get payment intent');
      }

      return result;
    } catch (error) {
      console.error('BayarCash API Error:', error);
      throw error;
    }
  }

  /**
   * Get transaction by order number
   */
  async getTransactionByOrderNumber(orderNumber: string): Promise<TransactionDetails[]> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions?order_number=${orderNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get transaction');
      }

      return result.data || [];
    } catch (error) {
      console.error('BayarCash API Error:', error);
      throw error;
    }
  }

  /**
   * Verify callback data
   */
  verifyCallback(callbackData: any): boolean {
    // Implement callback verification logic
    // This should verify the checksum in the callback
    const receivedChecksum = callbackData.checksum;
    const dataWithoutChecksum = { ...callbackData };
    delete dataWithoutChecksum.checksum;
    
    const calculatedChecksum = this.generateChecksum(dataWithoutChecksum);
    
    return receivedChecksum === calculatedChecksum;
  }

  /**
   * Get available payment channels
   */
  async getPaymentChannels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/portals/${this.config.portalKey}/channels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get payment channels');
      }

      return result.data || [];
    } catch (error) {
      console.error('BayarCash API Error:', error);
      throw error;
    }
  }
}

// Create singleton instance
let bayarCashInstance: BayarCashService | null = null;

export const initBayarCash = (config: BayarCashConfig): BayarCashService => {
  if (!bayarCashInstance) {
    bayarCashInstance = new BayarCashService(config);
  }
  return bayarCashInstance;
};

export const getBayarCash = (): BayarCashService => {
  if (!bayarCashInstance) {
    throw new Error('BayarCash service not initialized. Call initBayarCash first.');
  }
  return bayarCashInstance;
};

export default BayarCashService;
