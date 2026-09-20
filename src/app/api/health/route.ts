import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: "ok", db: "connected", timestamp: new Date() });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err?.message || String(err), timestamp: new Date() },
      { status: 500 }
    );
  }
}
