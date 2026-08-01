// app/api/auth/send-mobile-otp/route.ts
import { NextResponse } from 'next/server';

// TypeScript fix for global variable
const globalAny: any = global;
globalAny.otpStore = globalAny.otpStore || new Map();

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save OTP in memory (valid for 5 mins)
    globalAny.otpStore.set(mobile, otp);
    setTimeout(() => {
      globalAny.otpStore.delete(mobile);
    }, 5 * 60 * 1000); // 5 minutes expiry

    // 3. Send SMS via SMS Gateway Hub (JSON POST API for DLT Compliance)
    const apiKey = "Bw2oikFbF06tAoEmZDMHZA"; // Client's API Key
    const senderId = "COSMOX"; // Approved Sender ID
    
    // ⚠️ WARNING: CLIENT KE PANEL SE YE 3 CHEEZEIN DEKH KAR EXACT DAALNA ⚠️
    const entityId = "YAHAN_ENTITY_ID_DAALO";       // Example: "130115..." (DLT Principal Entity ID)
    const templateId = "YAHAN_TEMPLATE_ID_DAALO";   // Example: "130716..." (19-digit DLT Template ID)
    
    // Panel me jo exact message hai wahi yahan daalna. {#var#} ki jagah ${otp} lagana.
    const messageText = `Your OTP for Cosmopolitan Xccessories login is ${otp}. Do not share this with anyone.`; 

    // Official JSON format
    const requestBody = {
      "Account": {
        "APIkey": apiKey,
        "SenderId": senderId,
        "Channel": "2",
        "DCS": "0",
        "SchedTime": null,
        "GroupId": null,
        "EntityId": entityId
      },
      "Messages": [
        {
          "Text": messageText,
          "DLTTemplateId": templateId,
          "Number": `91${mobile}` // API format needs 91 before number
        }
      ]
    };

    const response = await fetch('https://www.smsgatewayhub.com/api/mt/SendSMS?', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("SMS API Response:", data); // Check your VS Code terminal to see success or error

    // 000 is success code for SMS Gateway Hub
    if (data.ErrorCode === "000" || data.ErrorMessage === "Success") {
      return NextResponse.json({ success: true, message: 'OTP Sent Successfully' });
    } else {
      return NextResponse.json({ success: false, message: data.ErrorMessage || 'Failed to send SMS' }, { status: 400 });
    }
  } catch (error) {
    console.error("SMS Sending Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}