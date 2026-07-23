import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection'; 
import UserModel from '@/models/User.model'; 
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectDB();
    
    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: "Email and new password are required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Agar user ke paas pehle se password hai (Normal Signup)
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required" }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
      }
    } 
    // Agar user ke paas password nahi hai (Google Login), toh current password ki zaroorat nahi hai, seedha set ho jayega.

    // Naya password hash karke save kar do
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}