import crypto from "crypto";
import axios from "axios";
import {
  createBenepikJWT,
  generateChecksum,
  generateSignature
} from "./security";
import { RewardPayload, BenepikResponse } from "./types";

export class BenepikClient {
  private proxyUrl: string;

  constructor() {
    const url = process.env.AWS_PROXY_URL;
    if (!url) {
      throw new Error("AWS_PROXY_URL is not configured");
    }
    this.proxyUrl = url;
  }

  async sendReward(rewardPayload: RewardPayload): Promise<BenepikResponse> {
    try {
      /* Generate security values */
      const requestId = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = crypto.randomBytes(16).toString("hex");
      const jwtToken = createBenepikJWT();
      const checksum = generateChecksum(rewardPayload);

      const signature = generateSignature({
        requestId,
        timestamp,
        nonce,
        checksum
      });

      /* Prepare headers for AWS proxy */
      const requestHeaders = {
        Authorization: `Bearer ${jwtToken}`,
        REQUESTID: requestId,
        "X-TIMESTAMP": timestamp.toString(),
        "X-NONCE": nonce,
        "X-SIGNATURE": signature,
      };

      /* Make API request through AWS proxy */
      const response = await axios.post(
        this.proxyUrl, // AWS proxy URL
        {
          checksum,
          requestHeaders
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error("Benepik API error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Reward API failed"
      };
    }
  }

  /**
   * Helper method to create a reward payload for a single user
   */
  createSingleRewardPayload(
    userName: string,
    mobileNumber: string,
    rewardAmount: number,
    options?: {
      countryCode?: string;
      entityId?: string;
      sendSms?: boolean;
      sendWhatsApp?: boolean;
      sendEmail?: boolean;
    }
  ): RewardPayload {
    return {
      source: "0",
      isSms: options?.sendSms !== false ? "1" : "0",
      isWhatsApp: options?.sendWhatsApp !== false ? "1" : "0",
      isEmail: options?.sendEmail !== false ? "1" : "0",
      data: [
        {
          sno: "1",
          userName,
          countryCode: options?.countryCode || "+91",
          mobileNumber,
          rewardAmount: rewardAmount.toString(),
          entityId: options?.entityId || "1886",
          transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
        }
      ]
    };
  }
}
