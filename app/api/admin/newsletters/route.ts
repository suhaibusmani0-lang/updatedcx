import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
  },
  { timestamps: true }
);

const NewsletterModel = mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema);

export async function GET() {
  try {
    await connectDB();
    const subscribers = await NewsletterModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, data: subscribers });
  } catch (error) {
    console.error("Admin Newsletter Fetch Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}