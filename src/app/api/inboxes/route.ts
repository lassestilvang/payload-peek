import { NextResponse } from "next/server";
import { Storage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    let name = "Primary Inbox";
    try {
      const body = await request.json();
      if (body.name && typeof body.name === "string") {
        name = body.name.slice(0, 50);
      }
    } catch {
      // Empty or non-JSON body is acceptable
    }

    const { inbox, ownerToken } = await Storage.createInbox(name);

    // Compute receiver URL using host header or configured origin
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const receiverUrl = `${proto}://${host}/api/hooks/${inbox.token}`;

    return NextResponse.json(
      {
        id: inbox.id,
        token: inbox.token,
        ownerToken,
        name: inbox.name,
        receiverUrl,
        createdAt: inbox.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create inbox:", error);
    return NextResponse.json(
      { error: "Internal server error creating inbox" },
      { status: 500 }
    );
  }
}
