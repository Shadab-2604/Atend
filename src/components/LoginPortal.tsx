"use client";

import React, { useState } from "react";
import { UserRole } from "@/types";
import { Calendar, Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ThemeSelector } from "./ThemeSelector";

interface LoginPortalProps {
  onLogin: (username: string, password: string, role?: UserRole) => Promise<void>;
  loading: boolean;
  error: string | null;
  initialRole?: UserRole;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin, loading, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username.trim(), password);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 pt-16 sm:pt-4 relative transition-colors"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeSelector />
      </div>

      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors"
        style={{ backgroundColor: "var(--accent-primary)" }}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center mb-7">
          <div
            className="w-14 h-14 mx-auto mb-3.5 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)",
              color: "var(--accent-text)",
              boxShadow: "0 8px 20px var(--accent-glow)",
            }}
          >
            <Calendar className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            AttendFlow Portal
          </h1>
          <p className="text-xs sm:text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
            Sign in with your credentials to access your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input
            type="text"
            name="prevent_autofill_user"
            id="prevent_autofill_user"
            style={{ position: "absolute", top: "-9999px", opacity: 0, pointerEvents: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />
          <input
            type="password"
            name="prevent_autofill_pwd"
            id="prevent_autofill_pwd"
            style={{ position: "absolute", top: "-9999px", opacity: 0, pointerEvents: "none" }}
            tabIndex={-1}
            autoComplete="new-password"
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                name="auth_username"
                id="auth_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter username"
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                name="auth_password"
                id="auth_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Enter password"
                className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--accent-text)",
                boxShadow: "0 6px 20px var(--accent-glow)",
              }}
            >
              <span>{loading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
