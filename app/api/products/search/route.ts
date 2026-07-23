import { NextResponse } from "next/server";
import ProductModel from "@/models/Product.model";
import { connectDB } from "@/lib/databaseConnection";

export async function GET(request: Request) {
  await connectDB();

  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") || "";

  const products = await ProductModel.find({
    name: {
      $regex: q,
      $options: "i",
    },
  });

  return NextResponse.json({
    products,
  });
}