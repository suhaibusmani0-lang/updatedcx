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
    const apiKey = "Bw2oikFbF06tAoEmZDMHZA"; 
    
    // ✅ FIX 1: Correct Sender ID
    const senderId = "COSXCC"; 
    
    // ✅ FIX 2: Correct DLT Entity ID
    const entityId = "1701178573811564521"; 
    
    // ✅ FIX 3: Correct DLT Template ID
    const templateId = "1777178575974446829"; 
    
    // ✅ FIX 4: Exact Approved Message Text (Replacing {#var#} with ${otp})
    const messageText = `Dear Customer, your One-Time Password (OTP) for logging into your Cosmopolitan Xccessories account is ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.`; 

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
    console.log("SMS API Response:", data); // Terminal check

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