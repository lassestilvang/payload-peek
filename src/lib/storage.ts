import crypto from "crypto";
import { WebhookInbox, WebhookEvent } from "./types";
import { Firestore, FieldValue } from "@google-cloud/firestore";

// Sensitive headers to redact for developer security
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "x-webhook-secret",
  "x-hub-signature",
  "x-hub-signature-256",
  "stripe-signature",
  "webhook-signature",
  "proxy-authorization",
]);

export function redactHeaders(
  headers: Record<string, string>
): { safe: Record<string, string>; raw: Record<string, string> } {
  const safe: Record<string, string> = {};
  const raw: Record<string, string> = { ...headers };

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(lowerKey)) {
      safe[key] = "•••••••• [REDACTED]";
    } else {
      safe[key] = value;
    }
  }

  return { safe, raw };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateId(prefix = ""): string {
  const random = crypto.randomBytes(8).toString("hex");
  return prefix ? `${prefix}_${random}` : random;
}

// In-memory / local fallback store for local development and offline environments
class MemoryStore {
  private inboxes = new Map<string, WebhookInbox>();
  private inboxesByToken = new Map<string, string>(); // token -> inboxId
  private events = new Map<string, WebhookEvent[]>(); // inboxId -> events

  async createInbox(inbox: WebhookInbox): Promise<WebhookInbox> {
    this.inboxes.set(inbox.id, inbox);
    this.inboxesByToken.set(inbox.token, inbox.id);
    this.events.set(inbox.id, []);
    return inbox;
  }

  async getInbox(id: string): Promise<WebhookInbox | null> {
    return this.inboxes.get(id) || null;
  }

  async getInboxByToken(token: string): Promise<WebhookInbox | null> {
    const id = this.inboxesByToken.get(token);
    if (!id) return null;
    return this.inboxes.get(id) || null;
  }

  async deleteInbox(id: string): Promise<boolean> {
    const inbox = this.inboxes.get(id);
    if (!inbox) return false;
    this.inboxesByToken.delete(inbox.token);
    this.inboxes.delete(id);
    this.events.delete(id);
    return true;
  }

  async saveEvent(event: WebhookEvent): Promise<WebhookEvent> {
    const list = this.events.get(event.inboxId) || [];
    // Keep max 50 events per inbox
    list.unshift(event);
    if (list.length > 50) {
      list.pop();
    }
    this.events.set(event.inboxId, list);

    const inbox = this.inboxes.get(event.inboxId);
    if (inbox) {
      inbox.eventCount = list.length;
      inbox.updatedAt = event.timestamp;
    }
    return event;
  }

  async getEvents(inboxId: string, limit = 50): Promise<WebhookEvent[]> {
    const list = this.events.get(inboxId) || [];
    return list.slice(0, limit);
  }

  async clearEvents(inboxId: string): Promise<void> {
    this.events.set(inboxId, []);
    const inbox = this.inboxes.get(inboxId);
    if (inbox) {
      inbox.eventCount = 0;
    }
  }
}

// Global singleton memory store
const memoryStore = new MemoryStore();

// Firestore client detection
let firestoreInstance: Firestore | null = null;
let firestoreDisabled = false;

function getFirestore(): Firestore | null {
  if (firestoreDisabled) return null;
  if (firestoreInstance) return firestoreInstance;

  // Check if we are running in Google Cloud or have credentials configured
  const hasGcpProject =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIRESTORE_PROJECT_ID;
  const hasKnative = !!process.env.K_SERVICE; // Standard Cloud Run environment variable

  if (hasGcpProject || hasKnative) {
    try {
      firestoreInstance = new Firestore({
        projectId: hasGcpProject || undefined,
        ignoreUndefinedProperties: true,
      });
      console.log("[PayloadPeek] Connected to Cloud Firestore.");
      return firestoreInstance;
    } catch (err) {
      console.warn(
        "[PayloadPeek] Firestore init failed, falling back to in-memory store:",
        err
      );
      firestoreDisabled = true;
      return null;
    }
  }

  return null;
}

export const Storage = {
  isFirestoreActive(): boolean {
    return getFirestore() !== null;
  },

  async createInbox(name = "Primary Inbox"): Promise<{
    inbox: WebhookInbox;
    ownerToken: string;
  }> {
    const id = generateId("inbox");
    const token = generateId("hook");
    const ownerToken = generateId("key") + generateId();
    const ownerTokenHash = hashToken(ownerToken);
    const now = new Date().toISOString();

    const inbox: WebhookInbox = {
      id,
      token,
      ownerTokenHash,
      name,
      createdAt: now,
      updatedAt: now,
      eventCount: 0,
    };

    const db = getFirestore();
    if (db) {
      try {
        await db.collection("inboxes").doc(id).set(inbox);
        // Also map token -> id for O(1) webhook receiver lookup
        await db.collection("tokens").doc(token).set({ inboxId: id });
        return { inbox, ownerToken };
      } catch (err) {
        console.error("Firestore createInbox error, using memory fallback", err);
      }
    }

    await memoryStore.createInbox(inbox);
    return { inbox, ownerToken };
  },

  async getInbox(id: string): Promise<WebhookInbox | null> {
    const db = getFirestore();
    if (db) {
      try {
        const doc = await db.collection("inboxes").doc(id).get();
        if (doc.exists) return doc.data() as WebhookInbox;
      } catch (err) {
        console.error("Firestore getInbox error", err);
      }
    }
    return memoryStore.getInbox(id);
  },

  async getInboxByToken(token: string): Promise<WebhookInbox | null> {
    const db = getFirestore();
    if (db) {
      try {
        const tokenDoc = await db.collection("tokens").doc(token).get();
        if (tokenDoc.exists) {
          const inboxId = tokenDoc.data()?.inboxId;
          if (inboxId) {
            const inboxDoc = await db.collection("inboxes").doc(inboxId).get();
            if (inboxDoc.exists) return inboxDoc.data() as WebhookInbox;
          }
        }
      } catch (err) {
        console.error("Firestore getInboxByToken error", err);
      }
    }
    return memoryStore.getInboxByToken(token);
  },

  async validateOwner(id: string, ownerToken: string): Promise<boolean> {
    const inbox = await this.getInbox(id);
    if (!inbox) return false;
    const providedHash = hashToken(ownerToken);
    return inbox.ownerTokenHash === providedHash;
  },

  async deleteInbox(id: string, ownerToken: string): Promise<boolean> {
    const valid = await this.validateOwner(id, ownerToken);
    if (!valid) return false;

    const inbox = await this.getInbox(id);
    const db = getFirestore();
    if (db && inbox) {
      try {
        // Delete token mapping
        await db.collection("tokens").doc(inbox.token).delete();
        // Delete all events in subcollection
        const eventsSnapshot = await db
          .collection("inboxes")
          .doc(id)
          .collection("events")
          .get();
        const batch = db.batch();
        eventsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        batch.delete(db.collection("inboxes").doc(id));
        await batch.commit();
        return true;
      } catch (err) {
        console.error("Firestore deleteInbox error", err);
      }
    }

    return memoryStore.deleteInbox(id);
  },

  async saveEvent(event: WebhookEvent): Promise<WebhookEvent> {
    const db = getFirestore();
    if (db) {
      try {
        await db
          .collection("inboxes")
          .doc(event.inboxId)
          .collection("events")
          .doc(event.id)
          .set(event);

        // Update inbox eventCount and timestamp
        await db
          .collection("inboxes")
          .doc(event.inboxId)
          .update({
            updatedAt: event.timestamp,
            eventCount: FieldValue.increment(1),
          });
        return event;
      } catch (err) {
        console.error("Firestore saveEvent error, using memory fallback", err);
      }
    }

    return memoryStore.saveEvent(event);
  },

  async getEvents(
    inboxId: string,
    ownerToken: string,
    limit = 50
  ): Promise<WebhookEvent[] | null> {
    const valid = await this.validateOwner(inboxId, ownerToken);
    if (!valid) return null;

    const db = getFirestore();
    if (db) {
      try {
        const snapshot = await db
          .collection("inboxes")
          .doc(inboxId)
          .collection("events")
          .orderBy("timestamp", "desc")
          .limit(limit)
          .get();

        return snapshot.docs.map((d) => d.data() as WebhookEvent);
      } catch (err) {
        console.error("Firestore getEvents error", err);
      }
    }

    return memoryStore.getEvents(inboxId, limit);
  },

  async clearEvents(inboxId: string, ownerToken: string): Promise<boolean> {
    const valid = await this.validateOwner(inboxId, ownerToken);
    if (!valid) return false;

    const db = getFirestore();
    if (db) {
      try {
        const snapshot = await db
          .collection("inboxes")
          .doc(inboxId)
          .collection("events")
          .get();
        const batch = db.batch();
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        await db.collection("inboxes").doc(inboxId).update({ eventCount: 0 });
        return true;
      } catch (err) {
        console.error("Firestore clearEvents error", err);
      }
    }

    await memoryStore.clearEvents(inboxId);
    return true;
  },
};
