import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';

// ⚠️ WARNING: In-memory storage (Map) is not recommended for Serverless environments (like Vercel).
// It can cause random "Invalid OTP" errors. It is highly recommended to use a Database (like OtpModel) instead.
const globalAny: any = global;
globalAny.otpStore = globalAny.otpStore || new Map();

export async function POST(req: Request) {
  try {
    await connectDB(); 

    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: 'Both mobile number and OTP are required' }, { status: 400 });
    }

    // 1. Check OTP from the in-memory store
    const storedOtp = globalAny.otpStore.get(mobile);

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid or Expired OTP' }, { status: 400 });
    }

    // 2. OTP verified successfully, remove it from memory
    globalAny.otpStore.delete(mobile);

    // 3. Check if the user exists in the database
    let user = await UserModel.findOne({ phone: mobile });
    let isNewUser = false;
    
    if (!user) {
      // Create a new user if not found
      user = await UserModel.create({ 
        phone: mobile, 
        name: "Customer", // Default name, will be updated via profile form later
        authProvider: "mobile", 
        role: "user"
      });
      isNewUser = true;
    } else if (user.name === "Customer" || !user.email) {
      // If it's an existing user but their profile is incomplete
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
          // Indicates to the frontend whether profile completion is needed
          isNewUser: isNewUser 
        } 
    });

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}