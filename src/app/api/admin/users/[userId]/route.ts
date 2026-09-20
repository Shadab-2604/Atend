import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { RegularizationRequest } from "@/models/RegularizationRequest";

// PUT /api/admin/users/[userId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    const { userId } = await params;
    const body = await req.json();
    const { name, username, email, role, password } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (username && String(username).trim()) {
      const cleanUsername = String(username).trim().toLowerCase();
      if (cleanUsername !== user.username) {
        const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
        if (existing) {
          return NextResponse.json({ error: `Username "${cleanUsername}" is already taken.` }, { status: 409 });
        }
        user.username = cleanUsername;
      }
    }

    if (email !== undefined) {
      user.email = String(email).trim().toLowerCase();
    }

    if (role && String(role).trim()) {
      const cleanRole = String(role).trim();
      if (user.role === "admin" && cleanRole !== "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "You are the only admin, please make someone else admin then only you can change this role." },
            { status: 400 }
          );
        }
      }
      user.role = cleanRole;
    }

    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters long." }, { status: 400 });
      }
      user.password = await bcrypt.hash(String(password).trim(), 10);
    }

    await user.save();
    const userObj = user.toObject();
    delete (userObj as any).password;

    return NextResponse.json({
      success: true,
      message: `User '${user.name}' updated successfully.`,
      user: userObj
    });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    const { userId } = await params;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "You are the only admin, please make someone else admin then only you can delete it." },
          { status: 400 }
        );
      }
    }

    await Attendance.deleteMany({ userId });
    await RegularizationRequest.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: `User '${user.name}' and all associated records deleted successfully.`
    });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
