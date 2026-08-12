import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import OtpModel from '@/models/Otp.model'; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const mobile = body?.mobile;

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `${mobile}@mobile.com`;
    
    await OtpModel.deleteMany({ email: identifier });
    const otpRecord = await OtpModel.create({ email: identifier, otp: otp });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'Database error: Failed to save OTP' }, { status: 500 });
    }

    const apiKey = "Bw2oikFbF06tAoEmZDMHZA"; 
    const senderId = "COSXCC"; 
    const entityId = "1701178573811564521"; 
    const templateId = "1777178575974446829"; 
    
    const messageText = `Dear Customer, your One-Time Password (OTP) for logging into your Cosmopolitan Xccessories account is ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.`; 

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
          "Number": `91${mobile}` 
        }
      ]
    };

    const response = await fetch('https://www.smsgatewayhub.com/api/mt/SendSMS?', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("SMS API Response:", data);

    if (data.ErrorCode === "000" || data.ErrorMessage === "Success") {
      return NextResponse.json({ success: true, message: 'OTP Sent Successfully' });
    } else {
      return NextResponse.json({ success: false, message: data.ErrorMessage || 'Failed to send SMS' }, { status: 400 });
    }
  } catch (error: any) {
    console.error("SMS Sending Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}