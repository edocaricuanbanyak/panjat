/**
 * Gateway selection by market. The checkout client and webhook gateway are
 * chosen from MARKET.paymentGateway so the same code serves the Indonesian
 * (Midtrans) and global (Polar) deployments.
 */
import { MARKET } from "@/lib/market";
import { isMock, midtransSnapClient, mockSnapClient, type SnapClient } from "@/lib/midtrans";
import { polarCheckoutClient, polarWebhookGateway } from "./polar-gateway";
import type { WebhookGateway } from "./types";

/** The checkout client for creating a payment (invoice/hosted checkout). */
export function getCheckoutClient(): SnapClient {
  if (MARKET.paymentGateway === "polar") return polarCheckoutClient;
  return isMock() ? mockSnapClient : midtransSnapClient;
}

/**
 * The webhook gateway (verify + normalize). Only defined for gateways whose
 * webhook is generic; Midtrans keeps its dedicated route + applyNotification.
 */
export function getWebhookGateway(): WebhookGateway | null {
  if (MARKET.paymentGateway === "polar") return polarWebhookGateway;
  return null;
}

export type { NormalizedNotification, WebhookGateway, RawWebhook } from "./types";
