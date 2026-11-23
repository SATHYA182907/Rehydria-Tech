import { NextResponse, type NextRequest } from "next/server";

/**
 * POST: exchange a fresh Firebase ID token for an httpOnly session cookie.
 * DELETE: sign out. Logic lives in src/services/auth/session-handler.ts; it is loaded lazily
 * so that a server packaging problem returns a readable JSON error instead of a blank 500.
 */
async function load() {
  try {
    return await import("@/services/auth/session-handler");
  } catch (err) {
    console.error("[auth/session] handler failed to load:", err);
    return err instanceof Error ? err : new Error(String(err));
  }
}

function loadFailure(err: Error) {
  return NextResponse.json(
    { error: "Sign-in is temporarily unavailable (server setup). Please try again later.", stage: "load", detail: err.message.slice(0, 300) },
    { status: 500 },
  );
}

export async function POST(req: NextRequest) {
  const mod = await load();
  return mod instanceof Error ? loadFailure(mod) : mod.handlePost(req);
}

export async function DELETE(req: NextRequest) {
  const mod = await load();
  return mod instanceof Error ? loadFailure(mod) : mod.handleDelete(req);
}

export async function GET() {
  const mod = await load();
  return mod instanceof Error ? loadFailure(mod) : mod.handleGet();
}
