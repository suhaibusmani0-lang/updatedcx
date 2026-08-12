import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import NotifyRequestModel from "@/models/NotifyRequest.model";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    // 1. Database se connect karo
    await connectDB();

    const body = await req.json();
    const { productId, productName, userName, contactDetails } = body;

    // 2. Validation
    if (!productId || !productName || !userName || !contactDetails) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const newRequest = await NotifyRequestModel.create({
      productId,
      productName,
      userName,
      contactDetails,
    });

    // 4. Email bhejne ke liye aapke diye gaye Transporter credentials setup karo
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: Number(process.env.NODEMAILER_PORT),
      secure: false, // 587 port ke liye false hota hai, 465 ke liye true
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    // 5. Email ka format aur details
    const mailOptions = {
      from: process.env.NODEMAILER_USER,       // Kahan se email jayegi
      to: process.env.NODEMAILER_USER,         // Kisko jayegi (Aapki id pe aayegi as Admin)
      subject: `🚨 Out of Stock Request: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A;">
          <h2 style="color: #C1121F;">New "Notify Me" Request!</h2>
          <p>A customer wants to buy an out-of-stock product. Here are the details:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p><strong>Product Name:</strong> ${productName}</p>
            <p><strong>Product ID:</strong> ${productId}</p>
            <p><strong>Customer Name:</strong> ${userName}</p>
            <p><strong>Contact Details:</strong> ${contactDetails}</p>
          </div>
          <p style="margin-top: 20px;">Please restock this item and contact the customer.</p>
        </div>
      `,
    };

    // 6. Email Send karo
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { 
        message: "Request saved successfully. Admin has been notified via email.",
        data: newRequest
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error in notify-admin API:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}