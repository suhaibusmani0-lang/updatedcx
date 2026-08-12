import { createHash } from "crypto";

const META_API_VERSION = process.env.META_GRAPH_API_VERSION || "v23.0";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1559963569009412";
const META_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || "";

function sha256(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function POST(req: Request) {
  if (!META_ACCESS_TOKEN) {
    return Response.json({ ok: false, skipped: true, reason: "Meta CAPI token is not configured" });
  }

  try {
    const body = await req.json();
    const eventName = String(body?.event_name || "").trim();
    const eventId = String(body?.event_id || "").trim();

    if (!eventName || !eventId) {
      return Response.json({ ok: false, message: "event_name and event_id are required" }, { status: 400 });
    }

    const requestUrl = new URL(req.url);
    const sourceUrl = String(body?.event_source_url || req.headers.get("referer") || requestUrl.origin);
    const user = body?.user_data || {};

    const userData: Record<string, unknown> = {
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      client_user_agent: req.headers.get("user-agent") || undefined,
      fbp: body?.fbp || undefined,
      fbc: body?.fbc || undefined,
      em: sha256(user.email),
      ph: sha256(normalizePhone(user.phone)),
      fn: sha256(user.firstName),
      ln: sha256(user.lastName),
      external_id: sha256(user.externalId),
    };

    Object.keys(userData).forEach((key) => {
      if (userData[key] === undefined || userData[key] === "") delete userData[key];
    });

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: sourceUrl,
          user_data: userData,
          custom_data: body?.event_data || {},
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[Meta CAPI] Failed:", data);
      return Response.json({ ok: false, message: "Meta CAPI request failed" }, { status: 502 });
    }

    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("[Meta CAPI] Error:", error);
    return Response.json({ ok: false, message: "Analytics request failed" }, { status: 500 });
  }
}
