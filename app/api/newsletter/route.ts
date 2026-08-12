import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

const NewsletterModel = mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema);

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, message: "Valid email is required" }, { status: 400 });
    }

    const existing = await (NewsletterModel as any).findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: true, message: "You are already subscribed!" });
    }

    await (NewsletterModel as any).create({ email });

    return NextResponse.json({ ok: true, message: "Successfully subscribed!" }, { status: 201 });
  } catch (error) {
    console.error("Newsletter API Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
