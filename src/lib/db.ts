import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import { User } from "../models/User";
import { Settings } from "../models/Settings";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attendance_tracker";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached: MongooseCache = global.mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (m) => {
      console.log(`[MongoDB] Connected successfully to: ${MONGODB_URI}`);
      await seedInitialData();
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

async function seedInitialData(): Promise<void> {
  try {
    // 1. Seed Settings if not existing
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        title: "Internship Attendance Tracker",
        totalWorkingDays: 45,
        startDate: "2026-09-15",
        endDate: "2026-11-05",
        workingHoursPerDay: 8
      });
      console.log("[MongoDB] Seeded default 45-day internship settings");
    }

    // 2. Seed Default Admin from .env
    const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminName = process.env.ADMIN_NAME || "Administrator";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@attendflow.internal";

    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        password: hashedAdminPassword,
        name: adminName,
        email: adminEmail,
        role: "admin",
        currentStatus: "logged_out"
      });
      console.log(`[MongoDB] Seeded production admin account: ${adminUsername}`);
    }

    // 3. Seed Default Intern: Shadab / shadab@123
    const existingShadab = await User.findOne({ username: "shadab" });
    if (!existingShadab) {
      const hashedShadabPassword = await bcrypt.hash("shadab@123", 10);
      await User.create({
        username: "shadab",
        password: hashedShadabPassword,
        name: "Shadab",
        email: "",
        role: "intern",
        currentStatus: "logged_out"
      });
      console.log("[MongoDB] Seeded intern account: shadab");
    }
  } catch (seedErr) {
    console.warn("[MongoDB] Seeding notice:", seedErr);
  }
}
