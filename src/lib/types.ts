export interface WebhookInbox {
  id: string;
  token: string; // Receiver token used in /api/hooks/[token]
  ownerTokenHash: string; // Hash of private token for dashboard access
  name: string;
  createdAt: string;
  updatedAt: string;
  eventCount: number;
}

export interface WebhookEvent {
  id: string;
  inboxId: string;
  token: string;
  timestamp: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  rawHeaders: Record<string, string>;
  body: unknown;
  rawBody: string;
  contentType: string;
  contentLength: number;
  ip: string;
  userAgent: string;
  sizeBytes: number;
}

export interface CreateInboxResponse {
  id: string;
  token: string;
  ownerToken: string;
  receiverUrl: string;
}

export interface SampleWebhookTemplate {
  id: string;
  name: string;
  provider: "Stripe" | "GitHub" | "Shopify" | "Clerk" | "Custom";
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
}
