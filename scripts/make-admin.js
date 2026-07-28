#!/usr/bin/env node

/**
 * Make a user an admin
 * Usage: node scripts/make-admin.js <email>
 */

import mongoose from "mongoose";
import UserModel from "@/models/User.model.js";

const email = process.argv[2]?.toLowerCase().trim();

if (!email) {
  console.error("Usage: node scripts/make-admin.js <email>");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not set in .env.local");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();
    console.log(`✓ User ${email} is now an admin`);
    console.log(`Current user data:`, { _id: user._id, email: user.email, role: user.role });
    process.exit(0);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();
