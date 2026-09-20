# Atend - Enterprise Internship Attendance & Presence Tracker

A unified fullstack **Next.js (App Router)** application for tracking internship working hours, live presence status (Working, On Break, Out of Office, Logged Out), and attendance regularizations. Designed for seamless one-click hosting on **Vercel**.

---

## ✨ Features

- **Unified Next.js Architecture**: Built using Next.js App Router with Serverless Route Handlers (`/api/...`).
- **Live Presence & Workstation**: Real-time status switching with exact hour/minute/second counters and shift cards.
- **Attendance Calendar**: 45-day internship calendar visualization with month/year filters and day details modals.
- **Regularization System**: Employee request submission and Admin approval/rejection workflow with real-time feedback.
- **Admin Dashboard**: Live team directory monitoring, status filtering, user management (CRUD user credentials), and attendance history.
- **MongoDB Atlas & Serverless Caching**: Powered by Mongoose with global connection caching to prevent database connection leaks on Vercel.
- **Responsive Modern UI**: Modern dark/light glassmorphic UI with CSS variable theme tokens.

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file at the root of the project (refer to `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/attendance_tracker?retryWrites=true&w=majority
JWT_SECRET=attendance_tracker_secret_jwt_key_2026
CLIENT_URL=http://localhost:3000

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@attendflow.internal
```

### 3. Database Seeding

To populate initial settings and test attendance records:

```bash
npm run seed
```

### 4. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.) under Project Settings -> Environment Variables.
4. Click **Deploy**. Vercel will run `npm run build` and launch your application!

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Database**: MongoDB Atlas & Mongoose
- **Auth**: JWT & bcryptjs
