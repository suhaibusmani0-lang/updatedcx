// app/api/auth/verify-mobile-otp/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User';

const globalAny: any = global;
globalAny.otpStore = globalAny.otpStore || new Map();

export async function POST(req: Request) {
  try {
    await connectDB(); 

    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: 'Mobile aur OTP dono zaroori hain' }, { status: 400 });
    }

    // 1. Check OTP from memory store (matches send-mobile-otp)
    const storedOtp = globalAny.otpStore.get(mobile);

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid ya Expired OTP' }, { status: 400 });
    }

    // 2. OTP verify ho gaya, memory se delete kar do
    globalAny.otpStore.delete(mobile);

    // 3. User ko dhundho, agar nahi hai toh create karo
    let user = await UserModel.findOne({ phone: mobile });
    
    if (!user) {
      user = await UserModel.create({ 
        phone: mobile, 
        name: "Customer", 
        authProvider: "mobile", 
        role: "user"
      });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Logged in successfully',
        data: { 
          user: {
            id: user._id.toString(),
            phone: user.phone,
            name: user.name,
            role: user.role,
            avatar: user.avatar?.url || ""
          }
        } 
    });

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}