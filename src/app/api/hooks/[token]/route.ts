import { NextResponse } from "next/server";
import { Storage, redactHeaders, generateId } from "@/lib/storage";
import { WebhookEvent } from "@/lib/types";

const MAX_PAYLOAD_BYTES = 128 * 1024; // 128 KB guardrail

async function handleWebhook(
  request: Request,
  paramsPromise: Promise<{ token: string }>
) {
  try {
    const { token } = await paramsPromise;

    // Look up inbox by token
    const inbox = await Storage.getInboxByToken(token);
    if (!inbox) {
      return NextResponse.json(
        {
          error: "Webhook inbox not found for this token.",
          message: "Generate a new active inbox at https://payloadpeek.dev",
        },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Parse query params
    const query: Record<string, string | string[]> = {};
    url.searchParams.forEach((val, key) => {
      if (query[key]) {
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(val);
        } else {
          query[key] = [query[key] as string, val];
        }
      } else {
        query[key] = val;
      }
    });

    // Parse headers
    const rawHeaders: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      rawHeaders[key] = val;
    });

    const { safe: headers, raw: originalHeaders } = redactHeaders(rawHeaders);

    // Read and enforce body size
    let rawBody = "";
    let body: unknown = null;
    let sizeBytes = 0;

    const contentType = request.headers.get("content-type") || "";
    const contentLength = parseInt(
      request.headers.get("content-length") || "0",
      10
    );

    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          error: "Payload Too Large",
          message: `Request exceeds 128KB maximum limit (${contentLength} bytes received).`,
        },
        { status: 413 }
      );
    }

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      try {
        const text = await request.text();
        sizeBytes = Buffer.byteLength(text, "utf8");

        if (sizeBytes > MAX_PAYLOAD_BYTES) {
          return NextResponse.json(
            {
              error: "Payload Too Large",
              message: `Payload exceeds 128KB limit (${sizeBytes} bytes).`,
            },
            { status: 413 }
          );
        }

        rawBody = text;
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        }
      } catch (err) {
        console.warn("Could not read request body:", err);
      }
    } else if (Object.keys(query).length > 0) {
      body = query;
      rawBody = JSON.stringify(query, null, 2);
      sizeBytes = Buffer.byteLength(rawBody, "utf8");
    }

    // IP detection
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = request.headers.get("user-agent") || "unknown";

    const event: WebhookEvent = {
      id: generateId("evt"),
      inboxId: inbox.id,
      token,
      timestamp: new Date().toISOString(),
      method,
      path: url.pathname,
      query,
      headers,
      rawHeaders: originalHeaders,
      body,
      rawBody,
      contentType,
      contentLength: sizeBytes,
      ip,
      userAgent,
      sizeBytes,
    };

    await Storage.saveEvent(event);

    return NextResponse.json(
      {
        received: true,
        id: event.id,
        timestamp: event.timestamp,
        status: 200,
        message: "Payload Peek successfully captured this webhook.",
      },
      {
        status: 200,
        headers: {
          "X-PayloadPeek-Event-Id": event.id,
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error handling incoming webhook:", error);
    return NextResponse.json(
      { error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleWebhook(req, params);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleWebhook(req, params);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleWebhook(req, params);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleWebhook(req, params);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleWebhook(req, params);
}

export async function OPTIONS(
  _req: Request,
  _context: { params: Promise<{ token: string }> }
) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
