import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";

export async function GET() {
  try {
    await connectDB();
    await processAutoPunchOut();

    const total = await User.countDocuments({ role: "intern" });
    const working = await User.countDocuments({ role: "intern", currentStatus: "working" });
    const onBreak = await User.countDocuments({ role: "intern", currentStatus: "break" });
    const ooo = await User.countDocuments({ role: "intern", currentStatus: "ooo" });
    const loggedOut = await User.countDocuments({ role: "intern", currentStatus: "logged_out" });

    return NextResponse.json({
      success: true,
      metrics: {
        total,
        working,
        break: onBreak,
        ooo,
        loggedOut
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch admin metrics." }, { status: 500 });
  }
}
