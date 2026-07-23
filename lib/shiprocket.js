const SHIPROCKET_BASE_URL = process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in";
const SHIPROCKET_API_KEY = process.env.SHIPROCKET_API_KEY;
const SHIPROCKET_API_SECRET = process.env.SHIPROCKET_API_SECRET;
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_PICKUP_PINCODE = process.env.SHIPROCKET_PICKUP_PINCODE || "400001";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

async function getShiprocketAuthToken() {
  if (SHIPROCKET_API_KEY && SHIPROCKET_API_SECRET) {
    return `${SHIPROCKET_API_KEY}:${SHIPROCKET_API_SECRET}`;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error("Shiprocket credentials are not configured");
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Shiprocket authentication failed");
  }

  return data?.token || data?.data?.token || null;
}

function getEstimatedWeight(items = []) {
  const weight = items.reduce((sum, item) => {
    const itemWeight = item?.weight || item?.weightKg || item?.shippingWeight || 0.5;
    return sum + Number(itemWeight) * (item?.qty || 1);
  }, 0);

  return Number.isFinite(weight) && weight > 0 ? weight : 0.5;
}

function pickCheapestCourier(services = []) {
  const courierOptions = services
    .map((service) => ({
      courierName: service?.courier_name || service?.courierName || "Shiprocket",
      shippingCharge: Number(service?.rate || service?.shipping_charge || service?.freight_charge || 0),
      shippingMethod: service?.shipping_method || service?.service_code || service?.courier_name || "standard",
    }))
    .filter((option) => Number.isFinite(option.shippingCharge));

  courierOptions.sort((a, b) => a.shippingCharge - b.shippingCharge);
  return courierOptions[0] || null;
}

export async function getShiprocketShippingQuote({ pincode, items = [] }) {
  if (!pincode) return null;

  const hasCredentials = Boolean(SHIPROCKET_API_KEY && SHIPROCKET_API_SECRET) || Boolean(SHIPROCKET_EMAIL && SHIPROCKET_PASSWORD);
  if (!hasCredentials) return null;

  const token = await getShiprocketAuthToken();
  if (!token) return null;

  const payload = {
    pickup_postcode: SHIPROCKET_PICKUP_PINCODE,
    delivery_postcode: String(pincode),
    weight: getEstimatedWeight(items),
    cod: 0,
    declared_value: 0,
  };

  const res = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/courier/serviceability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SHIPROCKET_API_KEY && SHIPROCKET_API_SECRET
        ? { "api-key": SHIPROCKET_API_KEY, "secret-key": SHIPROCKET_API_SECRET }
        : { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return null;

  const services = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.available_courier_companies)
      ? data.data.available_courier_companies
      : [];

  const cheapest = pickCheapestCourier(services);
  if (!cheapest) return null;

  return {
    shippingCharge: cheapest.shippingCharge,
    courierName: cheapest.courierName,
    shippingMethod: cheapest.shippingMethod,
  };
}

export function getFallbackShipping(subtotal) {
  return subtotal >= 2999 ? 0 : 99;
}

export { jsonRes };
