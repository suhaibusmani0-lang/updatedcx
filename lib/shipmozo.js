// ShipMozo API client
// All calls use HTTP GET/POST against https://shipping-api.com/app/api/v1

const SHIPMOZO_BASE = "https://shipping-api.com/app/api/v1";

function getKeys() {
  const publicKey = process.env.NEXT_PUBLIC_SHIPMOZO_PUBLIC_KEY;
  const privateKey = process.env.SHIPMOZO_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("ShipMozo credentials are not configured");
  }
  return { publicKey, privateKey };
}

function headers() {
  const { publicKey, privateKey } = getKeys();
  return {
    "Content-Type": "application/json",
    "public-key": publicKey,
    "private-key": privateKey,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
}

/** Push an order to ShipMozo. Returns the ShipMozo order_id + reference_id. */
export async function pushOrder(payload) {
  const response = await fetch(`${SHIPMOZO_BASE}/push-order`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  if (!response.ok || data.result === "0" || data.result === 0) {
    const message =
      data.message || data.error || data.detail || "Failed to push order to ShipMozo";
    const err = new Error(message);
    err.response = data;
    throw err;
  }
  return data;
}

/** Get live tracking status for an AWB from ShipMozo. */
export async function trackOrderByAwb(awbNumber) {
  if (!awbNumber) throw new Error("AWB number is required");
  const url = `${SHIPMOZO_BASE}/track-order?awb_number=${encodeURIComponent(awbNumber)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: headers(),
  });
  const data = await parseResponse(response);
  return data;
}

/** List all configured warehouses on ShipMozo. */
export async function getWarehouses() {
  const response = await fetch(`${SHIPMOZO_BASE}/get-warehouses`, {
    method: "GET",
    headers: headers(),
  });
  return parseResponse(response);
}

/**
 * Normalise a ShipMozo tracking response to a compact structure our UI understands.
 * Handles varied response shapes gracefully.
 */
export function normaliseTracking(raw) {
  if (!raw || typeof raw !== "object") {
    return { status: "Unknown", history: [], expectedDelivery: null, courierName: "", awb: "" };
  }

  const data = raw.data || raw.result_data || raw;
  const history = [];

  // ShipMozo returns tracking events in various keys — pick whatever is present
  const rawEvents =
    data.tracking_data ||
    data.scans ||
    data.tracking_history ||
    data.history ||
    data.events ||
    data.tracking ||
    [];

  if (Array.isArray(rawEvents)) {
    for (const ev of rawEvents) {
      if (!ev || typeof ev !== "object") continue;
      history.push({
        status: ev.status || ev.status_description || ev.remark || ev.activity || ev.message || "",
        remark: ev.remark || ev.status_description || ev.description || ev.message || "",
        location: ev.location || ev.city || ev.branch || "",
        timestamp:
          ev.timestamp ||
          ev.date ||
          ev.event_date ||
          ev.scan_datetime ||
          ev.datetime ||
          ev.updated_at ||
          null,
        status_code: ev.status_code || ev.code || "",
      });
    }
  }

  const currentStatus =
    data.current_status ||
    data.status ||
    (history[0] && history[0].status) ||
    (history[history.length - 1] && history[history.length - 1].status) ||
    "";

  return {
    status: currentStatus || "Pending",
    history: history,
    expectedDelivery:
      data.expected_delivery_date ||
      data.edd ||
      data.expected_delivery ||
      null,
    courierName: data.courier_name || data.courier || "",
    awb: data.awb_number || data.awb || "",
    raw,
  };
}
