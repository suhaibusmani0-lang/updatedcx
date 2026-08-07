import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';
import OtpModel from '@/models/Otp.model'; 
import { SignJWT } from 'jose'; 

export async function POST(req) {
  try {
    await connectDB(); 

    // Frontend se jo bhi aaye (mobile ya email) use nikal lo
    const { mobile, email, otp } = await req.json();

    if ((!mobile && !email) || !otp) {
      return NextResponse.json({ success: false, message: 'Email or Mobile, and OTP are required' }, { status: 400 });
    }

    // 1. Check OTP from Database based on Email OR Mobile
    let otpQuery = {};
    if (email) {
      otpQuery = { email: email.toLowerCase(), otp: otp };
    } else if (mobile) {
      otpQuery = {
        $or: [
          { mobile: mobile, otp: otp },
          { email: `${mobile}@mobile.com`, otp: otp } 
        ]
      };
    }

    const otpRecord = await OtpModel.findOne(otpQuery);

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'Invalid or Expired OTP' }, { status: 400 });
    }

    // 2. OTP verified successfully, delete it from DB so it can't be reused
    await OtpModel.deleteMany(otpQuery);

    // 3. User check and creation (Email or Mobile dono ke liye)
    let user;
    let isNewUser = false;
    
    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await UserModel.create({ 
          email: email.toLowerCase(), 
          name: "Customer", 
          authProvider: "email", 
          role: "user"
        });
        isNewUser = true;
      } else if (user.name === "Customer" || !user.phone) {
        isNewUser = true;
      }
    } else if (mobile) {
      user = await UserModel.findOne({ phone: mobile });
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
    }

    // 🔥 4. GENERATE TOKEN MATCHING YOUR MIDDLEWARE EXACTLY
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
    );
    
    // 🔴 FIX: Added 'userId' here because your adminMiddleware specifically checks for session.userId
    const token = await new SignJWT({ 
        userId: user._id.toString(), // Yeh line teri block request ko fix karegi
        id: user._id.toString(),     // Frontend/Safety ke liye id bhi retain rakha hai
        role: user.role 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Create the response object
    const response = NextResponse.json({ 
        success: true, 
        message: 'Logged in successfully',
        data: { 
          user: {
            id: user._id.toString(),
            phone: user.phone || "",
            email: user.email || "", 
            name: user.name,
            role: user.role,
            avatar: user.avatar?.url || ""
          },
          isNewUser: isNewUser 
        } 
    });

    // 🔥 5. SET THE "session" COOKIE FOR MIDDLEWARE
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}