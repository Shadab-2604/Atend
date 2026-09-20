#!/usr/bin/env node
/**
 * AttendFlow Database Seeder Script (seed.js)
 * 
 * Usage:
 *   node seed.js
 * 
 * Seeds attendance testing data specifically for user 'Shadab':
 * - 14 Sep: Absent (Day #1)
 * - 15 Sep: Present (Day #2, In: 8:40 AM, Out: 6:30 PM, Break: 1h, Net: 8h 50m)
 * - 16 Sep: Present (Day #3, In: 8:40 AM, Out: 6:30 PM, Break: 1h, Net: 8h 50m)
 * - 17 Sep: Present (Day #4, In: 8:40 AM, Out: 6:30 PM, Break: 1h, Net: 8h 50m)
 * - 18 Sep: Present (Day #5, In: 9:04 AM, Out: 6:38 PM, Break: 4m, Net: 9h 30m)
 * - 19 Sep: Present (Day #6, In: 8:07 AM, Out: 5:30 PM, Break: 91m, Net: 7h 52m)
 * - Ensures password is set to 'Shadab@123'
 * - Resets user presence to 'logged_out' for clean live testing today
 * - Leaves all other accounts (such as Admin) completely untouched
 */

const path = require("path");
const fs = require("fs");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment configuration
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attendance_tracker";

async function seedData() {
  console.log("\x1b[1m\x1b[36m%s\x1b[0m", "============================================================");
  console.log("\x1b[1m\x1b[36m%s\x1b[0m", "   🌱 AttendFlow Seed Script: Shadab Test Records");
  console.log("\x1b[1m\x1b[36m%s\x1b[0m", "============================================================\n");

  console.log(`Connecting to database at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const usersCollection = db.collection("users");
  const attendancesCollection = db.collection("attendances");
  const settingsCollection = db.collection("settings");

  // 1. Locate or create user Shadab
  let shadab = await usersCollection.findOne({ username: /^shadab$/i });
  const hashedPassword = await bcrypt.hash("Shadab@123", 10);

  if (!shadab) {
    console.log("Creating user 'shadab' (Shadab / Shadab@123)...");
    const insertRes = await usersCollection.insertOne({
      username: "shadab",
      password: hashedPassword,
      name: "Shadab",
      email: "",
      role: "intern",
      currentStatus: "logged_out",
      loginTime: null,
      loginTimestamp: null,
      logoutTime: null,
      breakStartTime: null,
      totalBreakMinutes: 0,
      oooStartTime: null,
      totalOooMinutes: 0,
      todayWorkingMinutes: 0,
      lastStatusChangeTimestamp: null,
      accumulatedWorkSeconds: 0,
      accumulatedBreakSeconds: 0,
      accumulatedOooSeconds: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    shadab = { _id: insertRes.insertedId, username: "shadab", name: "Shadab" };
    console.log(`✓ User created with ID: ${shadab._id}`);
  } else {
    // Update password to ensure Shadab@123 is valid & reset today's active shift status
    await usersCollection.updateOne(
      { _id: shadab._id },
      {
        $set: {
          password: hashedPassword,
          currentStatus: "logged_out",
          loginTime: null,
          loginTimestamp: null,
          logoutTime: null,
          breakStartTime: null,
          totalBreakMinutes: 0,
          oooStartTime: null,
          totalOooMinutes: 0,
          todayWorkingMinutes: 0,
          lastStatusChangeTimestamp: null,
          accumulatedWorkSeconds: 0,
          accumulatedBreakSeconds: 0,
          accumulatedOooSeconds: 0,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✓ Found user 'shadab' (ID: ${shadab._id}). Updated password to 'Shadab@123' and reset status to 'logged_out'.`);
  }

  // 2. Configure 45-day cycle in settings starting 2026-09-14 so Sep 14 is Day #1
  await settingsCollection.updateOne(
    {},
    {
      $set: {
        startDate: "2026-09-14",
        totalWorkingDays: 45,
        workingHoursPerDay: 8,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log("✓ Synchronized Calendar Settings: Start Date = 2026-09-14 (45 Working Days cycle)");

  // 3. Define the records to seed
  const testRecords = [
    {
      userId: shadab._id,
      date: "2026-09-14",
      dayNumber: 1,
      status: "absent",
      workMode: "WFO",
      login: null,
      logout: null,
      duration: { totalMinutes: 0, hours: 0, minutes: 0 },
      breakMinutes: 0,
      oooMinutes: 0,
      notes: "Testing record: Absent on Sep 14"
    },
    {
      userId: shadab._id,
      date: "2026-09-15",
      dayNumber: 2,
      status: "present",
      workMode: "WFO",
      login: {
        time: "08:40",
        timestamp: new Date("2026-09-15T08:40:00")
      },
      logout: {
        time: "18:30",
        timestamp: new Date("2026-09-15T18:30:00")
      },
      duration: { totalMinutes: 530, hours: 8, minutes: 50 },
      breakMinutes: 60,
      oooMinutes: 0,
      notes: "Testing record: Present (In: 8:40 AM, Out: 6:30 PM, 1h break)"
    },
    {
      userId: shadab._id,
      date: "2026-09-16",
      dayNumber: 3,
      status: "present",
      workMode: "WFO",
      login: {
        time: "08:40",
        timestamp: new Date("2026-09-16T08:40:00")
      },
      logout: {
        time: "18:30",
        timestamp: new Date("2026-09-16T18:30:00")
      },
      duration: { totalMinutes: 530, hours: 8, minutes: 50 },
      breakMinutes: 60,
      oooMinutes: 0,
      notes: "Testing record: Present (In: 8:40 AM, Out: 6:30 PM, 1h break)"
    },
    {
      userId: shadab._id,
      date: "2026-09-17",
      dayNumber: 4,
      status: "present",
      workMode: "WFO",
      login: {
        time: "08:40",
        timestamp: new Date("2026-09-17T08:40:00")
      },
      logout: {
        time: "18:30",
        timestamp: new Date("2026-09-17T18:30:00")
      },
      duration: { totalMinutes: 530, hours: 8, minutes: 50 },
      breakMinutes: 60,
      oooMinutes: 0,
      notes: "Testing record: Present (In: 8:40 AM, Out: 6:30 PM, 1h break)"
    },
    {
      userId: shadab._id,
      date: "2026-09-18",
      dayNumber: 5,
      status: "present",
      workMode: "WFO",
      login: {
        time: "09:04",
        timestamp: new Date("2026-09-18T09:04:00")
      },
      logout: {
        time: "18:38",
        timestamp: new Date("2026-09-18T18:38:00")
      },
      duration: { totalMinutes: 570, hours: 9, minutes: 30 },
      breakMinutes: 4,
      oooMinutes: 0,
      notes: "Testing record: Present (In: 9:04 AM, Out: 6:38 PM)"
    },
    {
      userId: shadab._id,
      date: "2026-09-19",
      dayNumber: 6,
      status: "present",
      workMode: "WFO",
      login: {
        time: "08:07",
        timestamp: new Date("2026-09-19T08:07:00")
      },
      logout: {
        time: "17:30",
        timestamp: new Date("2026-09-19T17:30:00")
      },
      duration: { totalMinutes: 472, hours: 7, minutes: 52 },
      breakMinutes: 91,
      oooMinutes: 0,
      notes: "Testing record: Present (In: 8:07 AM, Out: 5:30 PM)"
    }
  ];

  console.log("\n4. Pushing attendance records to database for Shadab...");
  for (const rec of testRecords) {
    await attendancesCollection.updateOne(
      { userId: shadab._id, date: rec.date },
      {
        $set: {
          ...rec,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✓ [${rec.date}] -> Status: ${rec.status.toUpperCase()} | Day #${rec.dayNumber} | ` +
      (rec.status === "present"
        ? `Punch: ${rec.login.time} - ${rec.logout.time} (Break: ${rec.breakMinutes}m, Net: ${rec.duration.hours}h ${rec.duration.minutes}m)`
        : `0h 0m logged`));
  }

  // Summary of database state
  const totalUsers = await usersCollection.countDocuments();
  const shadabAttendances = await attendancesCollection.find({ userId: shadab._id }).sort({ date: 1 }).toArray();

  console.log("\n============================================================");
  console.log("   ✅ Seeding Complete!");
  console.log(`   • Total Users in DB      : ${totalUsers}`);
  console.log(`   • Shadab Attendance Days : ${shadabAttendances.length} records`);
  shadabAttendances.forEach(a => {
    console.log(`     - ${a.date} (Day #${a.dayNumber}): ${a.status.toUpperCase()}`);
  });
  console.log("   • User Credentials       : Username: 'Shadab', Password: 'Shadab@123'");
  console.log("============================================================\n");

  await mongoose.disconnect();
}

seedData().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
