import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';
import OtpModel from '@/models/Otp.model'; 

export async function POST(req) { // 👈 Dekho yahan se ': Request' hata diya hai
  try {
    await connectDB(); 

    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: 'Mobile and OTP are required' }, { status: 400 });
    }

    const identifier = `${mobile}@mobile.com`; 

    // 1. Check OTP from Database
    const otpRecord = await OtpModel.findOne({ email: identifier, otp: otp });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'Invalid or Expired OTP' }, { status: 400 });
    }

    // 2. OTP verified successfully, delete it from DB so it can't be reused
    await OtpModel.deleteMany({ email: identifier });

    // 3. User check and creation
    let user = await UserModel.findOne({ phone: mobile });
    let isNewUser = false;
    
    if (!user) {
      // Create a new user if not found
      user = await UserModel.create({ 
        phone: mobile, 
        name: "Customer", 
        authProvider: "mobile", 
        role: "user"
      });
      isNewUser = true;
    } else if (user.name === "Customer" || !user.email) {
      // Existing user but profile is incomplete
      isNewUser = true;
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
          },
          isNewUser: isNewUser 
        } 
    });

  } catch (error) { // 👈 Yahan se ': any' bhi hata diya hai
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}