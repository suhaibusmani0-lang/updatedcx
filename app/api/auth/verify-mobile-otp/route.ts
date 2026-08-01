// app/api/auth/verify-mobile-otp/route.ts
import { NextResponse } from 'next/server';
// You should import your database logic here to fetch/create user
 import dbConnect from '@/lib/databaseConnection'; 
// import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { mobile, otp } = await req.json();

    const storedOtp = global.otpStore?.get(mobile);

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    // OTP is correct! Clear it from memory
    global.otpStore.delete(mobile);

    // TODO: Create or fetch user from your MongoDB/Database based on mobile number
    // Example:
    // await dbConnect();
    // let user = await User.findOne({ phone: mobile });
    // if(!user) { user = await User.create({ phone: mobile, name: "User" }); }

    // Mocking a successful user return for Redux
    const user = { phone: mobile, name: "Mobile User", id: Date.now().toString() };

    return NextResponse.json({ 
        success: true, 
        message: 'Logged in successfully',
        data: { user } 
    });

  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}