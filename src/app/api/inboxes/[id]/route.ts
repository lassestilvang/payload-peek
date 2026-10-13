import { NextResponse } from "next/server";
import { Storage } from "@/lib/storage";

function getOwnerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get("token") || url.searchParams.get("ownerToken");
}

export async function GET(
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

    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const receiverUrl = `${proto}://${host}/api/hooks/${inbox.token}`;

    return NextResponse.json({
      inbox: {
        id: inbox.id,
        token: inbox.token,
        name: inbox.name,
        receiverUrl,
        createdAt: inbox.createdAt,
        updatedAt: inbox.updatedAt,
        eventCount: inbox.eventCount,
      },
    });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerToken = getOwnerToken(request);

    if (!ownerToken) {
      return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
    }

    const success = await Storage.deleteInbox(id, ownerToken);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized or inbox not found" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: "Inbox and events deleted" });
  } catch (error) {
    console.error("Error deleting inbox:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
