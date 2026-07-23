import { getSession } from "@/lib/auth";

/** @param {number} status @param {string} message @param {unknown} [data=null] */
export function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function requireAdmin() {
  try {
    const session = await getSession();
    console.log("[Admin Check] Session:", session ? { userId: session.userId, role: session.role } : null);
    if (!session?.userId) {
      console.log("[Admin Check] Failed - Not authenticated");
      return jsonRes(401, "Not authenticated");
    }
    if (session.role !== "admin") {
      console.log("[Admin Check] Failed - User role is:", session.role);
      return jsonRes(403, "Admin access required");
    }
    console.log("[Admin Check] Passed");
    return null;
  } catch (error) {
    console.error("[Admin Check] Error:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Admin check failed");
  }
}
