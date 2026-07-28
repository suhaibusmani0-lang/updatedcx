import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) return jsonResponse(401, "Not authenticated");

    await connectDB();
    const user = await UserModel.findById(session.userId).select("addresses");
    if (!user) return jsonResponse(404, "User not found");

    return jsonResponse(200, "Addresses fetched", user.addresses || []);
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.userId) return jsonResponse(401, "Not authenticated");

    await connectDB();
    const body = await req.json();
    const { type, name, phone, address, city, state, pincode, isDefault } = body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return jsonResponse(400, "All address fields are required");
    }

    const user = await UserModel.findById(session.userId);
    if (!user) return jsonResponse(404, "User not found");

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({
      type: type || "Home" || "Other" || "Office" || "Shipping" || "Billing",
      name,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();
    return jsonResponse(201, "Address added", user.addresses);
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.userId) return jsonResponse(401, "Not authenticated");

    await connectDB();
    const { addressId, ...updates } = await req.json();
    if (!addressId) return jsonResponse(400, "Address ID is required");

    const user = await UserModel.findById(session.userId);
    if (!user) return jsonResponse(404, "User not found");

    const addr = user.addresses.id(addressId);
    if (!addr) return jsonResponse(404, "Address not found");

    if (updates.isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    Object.assign(addr, updates);
    await user.save();
    return jsonResponse(200, "Address updated", user.addresses);
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session?.userId) return jsonResponse(401, "Not authenticated");

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");
    if (!addressId) return jsonResponse(400, "Address ID is required");

    await connectDB();
    const user = await UserModel.findById(session.userId);
    if (!user) return jsonResponse(404, "User not found");

    user.addresses.pull(addressId);
    await user.save();
    return jsonResponse(200, "Address deleted", user.addresses);
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
