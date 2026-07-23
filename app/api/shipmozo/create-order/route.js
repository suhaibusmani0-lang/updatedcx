import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const orderData = await req.json();

    const SHIPMOZO_API_URL = 'https://shipping-api.com/app/api/v1/push-order';
    const publicKey = process.env.NEXT_PUBLIC_SHIPMOZO_PUBLIC_KEY;
    const privateKey = process.env.SHIPMOZO_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      throw new Error('ShipMozo credentials are not configured');
    }

    const paymentMethod = String(orderData.paymentMethod || '').toLowerCase();
    const paymentType = paymentMethod === 'razorpay' || paymentMethod === 'prepaid' ? 'PREPAID' : 'COD';
    const items = Array.isArray(orderData.items) ? orderData.items : [];

    const payload = {
      order_id: String(orderData.orderId),
      order_date: new Date().toISOString().split('T')[0],
      consignee_name: orderData.customerName,
      consignee_phone: Number(orderData.phone),
      consignee_email: orderData.email || '',
      consignee_address_line_one: orderData.address,
      consignee_pin_code: Number(orderData.pincode),
      consignee_city: orderData.city,
      consignee_state: orderData.state,
      payment_type: paymentType,
      // 👇 YEH NAYI LINE ADD KI HAI (COD Amount ke liye)
      cod_amount: paymentType === 'COD' ? String(orderData.totalAmount || 0) : "",
      weight: 500,
      length: 10,
      width: 10,
      height: 10,
      warehouse_id: '26652',
      product_detail: items.map((item) => ({
        name: item.name || 'Product',
        sku_number: String(item.sku || item.id || ''),
        quantity: Number(item.units || item.qty || 1),
        unit_price: Number(item.selling_price || item.price || 0),
        product_category: item.category || 'Other',
        discount: "", // ShipMozo ki requirement puri karne ke liye blank string
        hsn: "",      // Safe side ke liye HSN bhi blank bhej diya
      })),
    };

    const response = await fetch(SHIPMOZO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'public-key': publicKey,
        'private-key': privateKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }

    if (!response.ok || data.result === '0' || data.result === 0) {
      const message = data.message || data.error || data.detail || 'Failed to push order to ShipMozo';
      console.error('ShipMozo upstream error', { status: response.status, body: data, payload });
      throw new Error(message);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('ShipMozo Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}