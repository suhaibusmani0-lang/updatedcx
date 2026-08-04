import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';
import OtpModel from '@/models/Otp.model'; 
import jwt from 'jsonwebtoken'; // 👈 Naya Import: Token banane ke liye
import { cookies } from 'next/headers'; // 👈 Naya Import: Cookie set karne ke liye

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
    // 🚀 NAYA CODE: TOKEN GENERATE AUR COOKIE SET KARNA
    // ==========================================
    
    // Yahan apni .env file ka JWT secret daalna, agar alag naam se ho toh change kar lena
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default_secret_key';
    
    // Token generate kar rahe hain (7 din ke liye valid)
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });

    // Browser mein cookie set kar rahe hain taaki Middleware usko pehchaan le
    cookies().set('token', token, {
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