/**
 * Notification delivery + unsubscribe tokens (R3). No email/WA provider yet
 * (WhatsApp cost is an open question, §13), so the default senders log to the
 * console and report success. Both senders are injectable for tests/sims.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SendResult {
  ok: boolean;
}

export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<SendResult>;
}
export interface WaSender {
  send(to: string, body: string): Promise<SendResult>;
}

export interface Senders {
  email: EmailSender;
  wa: WaSender;
}

export const consoleEmailSender: EmailSender = {
  async send(to, subject, body) {
    console.log(`[email→${to}] ${subject}\n${body}`);
    return { ok: true };
  },
};

export const consoleWaSender: WaSender = {
  async send(to, body) {
    console.log(`[wa→${to}] ${body}`);
    return { ok: true };
  },
};

export const defaultSenders: Senders = {
  email: consoleEmailSender,
  wa: consoleWaSender,
};

// --- Unsubscribe token (HMAC over kontakId), same pattern as session.ts -------

function secret(): string {
  return process.env.NOTIF_SECRET ?? "dev-notif-secret";
}

export function signUnsub(kontakId: string): string {
  const payload = Buffer.from(kontakId).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnsub(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(payload, "base64url").toString();
}
