import crypto from "crypto";
import jwt from "jsonwebtoken";

/* ---------- JWT ---------- */
export function createBenepikJWT() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    iat: issuedAt,
    exp: issuedAt + 900,
    iss: "benepik-tech",
    aud: "client-system",
    jti: crypto.randomBytes(16).toString("base64"),
    clientId: 2364,  // Updated from Excel: Client Details - Zopper
    adminId: 926,    // Updated from Excel: Client Details - Zopper
    event: "reward"
  };

  const authKey = process.env.BENEPIK_AUTH_KEY;
  if (!authKey) {
    throw new Error("BENEPIK_AUTH_KEY is not configured");
  }

  return jwt.sign(payload, authKey, {
    algorithm: "HS256"
  });
}

/* ---------- CHECKSUM (AES-256-CBC) ---------- */
export function generateChecksum(payload: any) {
  const secretKey = process.env.BENEPIK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("BENEPIK_SECRET_KEY is not configured");
  }

  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash("sha256")
    .update(secretKey)
    .digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");

  const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
  return combined.toString("base64");
}

/* ---------- HMAC SIGNATURE ---------- */
export function generateSignature({
  requestId,
  timestamp,
  nonce,
  checksum
}: {
  requestId: string;
  timestamp: number;
  nonce: string;
  checksum: string;
}) {
  const secretKey = process.env.BENEPIK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("BENEPIK_SECRET_KEY is not configured");
  }

  const signatureString = `${requestId}|${timestamp}|${nonce}|${checksum}`;

  return crypto
    .createHmac("sha256", secretKey)
    .update(signatureString)
    .digest("base64");
}
