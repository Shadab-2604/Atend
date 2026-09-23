import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import { User } from "../models/User";
import { Settings } from "../models/Settings";

// Set custom DNS servers ONLY in local environment (Vercel blocks external UDP DNS queries to 8.8.8.8)
if (!process.env.VERCEL) {
  if (typeof dns.setDefaultResultOrder === "function") {
    try {
      dns.setDefaultResultOrder("ipv4first");
    } catch (e) {}
  }
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {}
}

const DEFAULT_MONGODB_URI = "mongodb+srv://skgamerpro123_db_user:DGOVJc6ZccJogDb0@cluster0.kyrm1d0.mongodb.net/attendance_tracker?retryWrites=true&w=majority";
let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
if (MONGODB_URI.startsWith("mongodb+srv://") && !MONGODB_URI.includes("/attendance_tracker") && !MONGODB_URI.split("?")[0].split("/")[3]) {
  MONGODB_URI = MONGODB_URI.replace(".mongodb.net/", ".mongodb.net/attendance_tracker");
}

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

let hasSeeded = false;

async function seedInitialDataOnce(): Promise<void> {
  if (hasSeeded) return;
  hasSeeded = true;
  await seedInitialData();
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (typeof dns.setDefaultResultOrder === "function") {
    try {
      dns.setDefaultResultOrder("ipv4first");
    } catch (e) {}
  }
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {}

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (m) => {
      console.log(`[MongoDB] Connected successfully to: ${MONGODB_URI}`);
      await seedInitialDataOnce();
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.warn("[MongoDB] Initial connection attempt failed, retrying with DNS fallback:", e?.message);
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      cached.conn = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      });
      await seedInitialDataOnce();
      return cached.conn;
    } catch (retryErr) {
      throw e;
    }
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

    const existingAdmin = await User.findOne({ username: adminUsername });
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
