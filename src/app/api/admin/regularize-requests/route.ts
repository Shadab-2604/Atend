import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RegularizationRequest } from "@/models/RegularizationRequest";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter = status && status !== "all" ? { status } : {};
    const requests = await RegularizationRequest.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, requests });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch regularization requests." }, { status: 500 });
  }
}
