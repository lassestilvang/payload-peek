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

    const events = await Storage.getEvents(id, ownerToken, 50);
    if (events === null) {
      return NextResponse.json({ error: "Unauthorized or inbox not found" }, { status: 403 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
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

    const success = await Storage.clearEvents(id, ownerToken);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized or inbox not found" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: "Inbox events cleared" });
  } catch (error) {
    console.error("Error clearing events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
