import { NextResponse } from "next/server";
import { Storage, redactHeaders, generateId } from "@/lib/storage";
import { SAMPLE_TEMPLATES } from "@/lib/templates";
import { WebhookEvent } from "@/lib/types";

function getOwnerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get("token") || url.searchParams.get("ownerToken");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerToken = getOwnerToken(request);

    if (!ownerToken) {
      return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
    }

    const valid = await Storage.validateOwner(id, ownerToken);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const inbox = await Storage.getInbox(id);
    if (!inbox) {
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }

    let templateId = "stripe-checkout";
    try {
      const body = await request.json();
      if (body.templateId) {
        templateId = body.templateId;
      }
    } catch {
      // Use default
    }

    const template =
      SAMPLE_TEMPLATES.find((t) => t.id === templateId) || SAMPLE_TEMPLATES[0];

    const rawBody = JSON.stringify(template.payload, null, 2);
    const sizeBytes = Buffer.byteLength(rawBody, "utf8");
    const { safe, raw } = redactHeaders(template.headers);

    const event: WebhookEvent = {
      id: generateId("evt"),
      inboxId: inbox.id,
      token: inbox.token,
      timestamp: new Date().toISOString(),
      method: template.method,
      path: `/api/hooks/${inbox.token}`,
      query: {},
      headers: safe,
      rawHeaders: raw,
      body: template.payload,
      rawBody,
      contentType: "application/json",
      contentLength: sizeBytes,
      ip: "127.0.0.1 (Sample Simulator)",
      userAgent: template.headers["user-agent"] || "PayloadPeek-Simulator/1.0",
      sizeBytes,
    };

    await Storage.saveEvent(event);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error creating sample event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
