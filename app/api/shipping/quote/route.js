import { getFallbackShipping, getShiprocketShippingQuote, jsonRes } from "@/lib/shiprocket";

export async function POST(req) {
  try {
    const { pincode, items = [] } = await req.json();
    if (!pincode) return jsonRes(400, "Pincode is required");

    const quote = await getShiprocketShippingQuote({ pincode, items });
    const shippingCharge = quote?.shippingCharge ?? getFallbackShipping(items.reduce((sum, item) => sum + item.price * item.qty, 0));

    return jsonRes(200, "Shipping quote fetched", {
      shippingCharge,
      courierName: quote?.courierName || "Standard",
      shippingMethod: quote?.shippingMethod || "standard",
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Unable to fetch shipping quote");
  }
}
