import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";

// GET /api/admin/users
export async function GET(req: Request) {
  try {
    await connectDB();
    await processAutoPunchOut();
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    const filter = roleFilter && roleFilter !== "all" ? { role: roleFilter } : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, users });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, username, password, role, email, startDate: reqStartDate, endDate: reqEndDate } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Name, username, and password are required." }, { status: 400 });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json({ error: `Username "${cleanUsername}" is already taken.` }, { status: 409 });
    }

    let userRole = role ? String(role).trim() : "intern";
    let finalStartDate = reqStartDate ? String(reqStartDate).trim() : "";
    let finalEndDate = reqEndDate ? String(reqEndDate).trim() : "";

    // If role is intern and startDate is provided without endDate, default to +45 days
    if (userRole === "intern" && finalStartDate && !finalEndDate) {
      const sDate = new Date(finalStartDate);
      if (!isNaN(sDate.getTime())) {
        const eDate = new Date(sDate);
        eDate.setDate(eDate.getDate() + 45);
        finalEndDate = eDate.toISOString().split("T")[0];
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: String(name).trim(),
      username: cleanUsername,
      password: hashedPassword,
      role: userRole,
      email: email ? String(email).trim().toLowerCase() : "",
      startDate: finalStartDate,
      endDate: finalEndDate,
      currentStatus: "logged_out"
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email,
          startDate: newUser.startDate,
          endDate: newUser.endDate,
          currentStatus: newUser.currentStatus
        }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin create user error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
