import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
// Dhyan de: Agar tere User model ka path alag hai, toh isko apne hisaab se change kar lena
import UserModel from "@/models/User.model"; 

export async function POST(req: Request) {
  try {
    // 1. Frontend se aane wala data read karna
    const body = await req.json();
    const { email, name, phone } = body;

    // 2. Validation (Check karna ki email aur naam bheja hai ya nahi)
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required to find the user" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    // 3. Database se connect karna
    await connectDB();

    // Email ke basis par user dhoondh rahe hain kyunki email disabled (fixed) tha
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email }, 
      { 
        $set: { 
          name: name, 
          phone: phone 
        } 
      },
      { new: true } // Yeh ensure karta hai ki updated data wapas mile
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 5. Success response bhejna (Isi se tera '<' wala error door hoga!)
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Profile update error:", error);
    // Agar koi server error aaye toh valid JSON error message bhejna
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}