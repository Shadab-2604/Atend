import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";

export async function GET() {
  try {
    await connectDB();
    await processAutoPunchOut();

    const counts = await User.aggregate([
      { $match: { role: "intern" } },
      { $group: { _id: "$currentStatus", count: { $sum: 1 } } }
    ]);

    let working = 0;
    let onBreak = 0;
    let ooo = 0;
    let loggedOut = 0;
    let total = 0;

    counts.forEach((c) => {
      total += c.count;
      if (c._id === "working") working = c.count;
      else if (c._id === "break") onBreak = c.count;
      else if (c._id === "ooo") ooo = c.count;
      else if (c._id === "logged_out") loggedOut = c.count;
    });

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
