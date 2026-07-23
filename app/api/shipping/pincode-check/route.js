// GET /api/shipping/pincode-check?pincode=110001
// - Validates 6-digit Indian pincode
// - Uses postalpincode.in (free, public) to fetch city/state
// - Computes an estimated delivery window based on distance from Delhi
// - Falls back gracefully if the external service is unreachable

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

// Delhi-adjacent states — 5-7 days delivery
const NEARBY_STATES = new Set([
  "delhi",
  "national capital territory of delhi",
  "haryana",
  "uttar pradesh",
  "punjab",
  "rajasthan",
  "uttarakhand",
  "himachal pradesh",
  "chandigarh",
]);

function computeEstimate(state) {
  const s = String(state || "").trim().toLowerCase();
  if (NEARBY_STATES.has(s)) {
    return { minDays: 5, maxDays: 7, label: "5-7 business days" };
  }
  return { minDays: 7, maxDays: 9, label: "7-9 business days" };
}

async function fetchPincodeDetails(pincode) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const arr = await res.json().catch(() => null);
    const first = Array.isArray(arr) ? arr[0] : null;
    if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || first.PostOffice.length === 0) {
      return null;
    }
    const po = first.PostOffice[0];
    return {
      city: po.District || po.Block || po.Name || "",
      state: po.State || "",
      district: po.District || "",
      country: po.Country || "India",
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = (searchParams.get("pincode") || "").trim();

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return jsonRes(400, "Please enter a valid 6-digit Indian PIN code", {
        valid: false,
      });
    }

    const details = await fetchPincodeDetails(pincode);

    if (!details) {
      // Serviceable but couldn't verify city — return generic estimate so UX doesn't hard-fail
      return jsonRes(200, "Delivery estimate available", {
        valid: false,
        pincode,
        city: null,
        state: null,
        estimate: { minDays: 7, maxDays: 9, label: "7-9 business days" },
        message: "Could not verify PIN code details. Standard delivery timeline applied.",
      });
    }

    return jsonRes(200, "Delivery details fetched", {
      valid: true,
      pincode,
      city: details.city,
      state: details.state,
      district: details.district,
      country: details.country,
      estimate: computeEstimate(details.state),
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Unable to check PIN code");
  }
}
