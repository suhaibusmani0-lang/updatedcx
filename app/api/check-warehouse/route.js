import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get-Warehouses API ka endpoint
    const SHIPMOZO_URL = 'https://shipping-api.com/app/api/v1/get-warehouses';

    const response = await fetch(SHIPMOZO_URL, {
      method: 'GET',
      headers: {
        // Apni keys headers mein bhejni hongi
        'public-key': process.env.NEXT_PUBLIC_SHIPMOZO_PUBLIC_KEY, 
        'private-key': process.env.SHIPMOZO_PRIVATE_KEY,
      }
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}