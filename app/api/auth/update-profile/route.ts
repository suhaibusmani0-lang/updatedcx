import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/databaseConnection';
import UserModel from '@/models/User.model';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, name, email } = await req.json();

    if (!phone || !name || !email) {
      return NextResponse.json({ success: false, message: 'Name and Email are required' }, { status: 400 });
    }

    // Phone number ke base par user ko update karo
    const updatedUser = await UserModel.findOneAndUpdate(
      { phone: phone },
      { name: name, email: email },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id.toString(),
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      }
    });

  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}