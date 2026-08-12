import { clearSessionCookie } from "@/lib/auth";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonResponse(200, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
