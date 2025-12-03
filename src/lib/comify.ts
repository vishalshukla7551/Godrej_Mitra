/**
 * Comify WhatsApp API Integration
 * Handles sending OTP and other messages via Comify's WhatsApp service
 */

interface ComifyPayload {
  name: string;
  payload: {
    phone: string;
    otp?: number;
    [key: string]: any;
  };
  type: string;
}

interface ComifyResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class ComifyService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = process.env.COMIFY_API_URL || 'https://commify.transify.tech/v1/comm';
    this.apiKey = process.env.COMIFY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[Comify] API key not configured. WhatsApp messages will not be sent.');
    }
  }

  /**
   * Send OTP via WhatsApp template
   */
  async sendOtp(phone: string, otp: string): Promise<ComifyResponse> {
    const templateName = process.env.COMIFY_TEMPLATE_NAME || 'zopper_oem_sec_otpverify';
    
    // Format phone number with country code (91 for India)
    const formattedPhone = this.formatPhoneNumber(phone);
    
    const payload: ComifyPayload = {
      name: templateName,
      payload: {
        phone: formattedPhone,
        otp: parseInt(otp, 10)
      },
      type: 'whatsappTemplate'
    };

    return this.sendMessage(payload);
  }

  /**
   * Send custom WhatsApp message
   */
  async sendCustomMessage(templateName: string, phone: string, data: Record<string, any>): Promise<ComifyResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    const payload: ComifyPayload = {
      name: templateName,
      payload: {
        phone: formattedPhone,
        ...data
      },
      type: 'whatsappTemplate'
    };

    return this.sendMessage(payload);
  }

  /**
   * Core method to send message via Comify API
   */
  private async sendMessage(payload: ComifyPayload): Promise<ComifyResponse> {
    if (!this.apiKey) {
      throw new Error('Comify API key not configured');
    }

    try {
      console.log(`[Comify] Sending message to ${payload.payload.phone} with template ${payload.name}`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Comify] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: result
        });
        throw new Error(`Comify API error: ${response.status} - ${result.message || response.statusText}`);
      }

      console.log('[Comify] Success:', result);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('[Comify] Request failed:', error);
      throw error;
    }
  }

  /**
   * Format phone number with country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's a 10-digit Indian number, add country code
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    // If it already has country code, return as is
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned;
    }
    
    // Default to adding 91 prefix
    return `91${cleaned.slice(-10)}`;
  }

  /**
   * Check if Comify service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const comifyService = new ComifyService();

// Export types for use in other files
export type { ComifyResponse, ComifyPayload };