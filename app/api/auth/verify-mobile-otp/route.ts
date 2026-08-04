import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';
import OtpModel from '@/models/Otp.model'; 
import jwt from 'jsonwebtoken'; 
import { cookies } from 'next/headers'; 

export async function POST(req: Request) {
  try {
    await connectDB(); 

    const body = await req.json();
    const { mobile, otp } = body;

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: 'Mobile and OTP are required' }, { status: 400 });
    }

    const identifier = `${mobile}@mobile.com`; 

    const otpRecord = await OtpModel.findOne({ email: identifier, otp: otp });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'Invalid or Expired OTP' }, { status: 400 });
    }

    await OtpModel.deleteMany({ email: identifier });

    let user = await UserModel.findOne({ phone: mobile });
    let isNewUser = false;
    
    if (!user) {
      user = await UserModel.create({ 
        phone: mobile, 
        name: "Customer", 
        authProvider: "mobile", 
        role: "user"
      });
      isNewUser = true;
    } else if (user.name === "Customer" || !user.email) {
      isNewUser = true;
    }

    // ==========================================
    // 🚀 FIXED: Cookie ka naam 'session' kar diya aur role add kiya
    // ==========================================
    // Secret string bilkul tumhare middleware jaisi rakhi hai
    const secret = process.env.JWT_SECRET || "fallback-dev-secret-change-in-production";
    
    // Token mein id ke sath role bhi bhej rahe hain
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });

    // Await lagana zaroori hai Next.js 15+ ke liye
    const cookieStore = await cookies();
    
    // Yahan cookie ka naam 'session' kar diya hai
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    // ==========================================

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

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}