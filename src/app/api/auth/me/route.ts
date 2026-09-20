import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET || "attendance_tracker_secret_jwt_key_2026";
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "Session expired or user not found." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
}
