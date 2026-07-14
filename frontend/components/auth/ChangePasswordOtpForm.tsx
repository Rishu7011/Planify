"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, Lock, Mail } from "lucide-react";

type ChangePasswordOtpFormProps = {
  /** Pre-fill / lock email (e.g. from session in Settings). */
  defaultEmail?: string;
  lockEmail?: boolean;
  /** Called after password successfully changed. */
  onSuccess?: () => void;
  successRedirectHint?: string;
  compact?: boolean;
};

const fieldClass =
  "w-full bg-white/5 border border-white/10 focus:border-[oklch(0.75_0.12_190_/_0.5)] focus:ring-1 focus:ring-[oklch(0.75_0.12_190_/_0.3)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[#9BA3AF] outline-none transition";

const labelClass =
  "block text-xs font-semibold text-[#9BA3AF] uppercase tracking-wider mb-2";

export function ChangePasswordOtpForm({
  defaultEmail = "",
  lockEmail = false,
  onSuccess,
  successRedirectHint,
  compact = false,
}: ChangePasswordOtpFormProps) {
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const requestOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/password-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not send code.");
        return;
      }
      setInfo(data.message || "Check your email for a 6-digit code.");
      setStep("confirm");
    } catch {
      setError("Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmChange = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/password-otp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not update password.");
        return;
      }
      setStep("done");
      setInfo(data.message);
      onSuccess?.();
    } catch {
      setError("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="text-center py-2 space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <p className="text-sm text-emerald-300 font-medium">
          {info || "Password updated successfully."}
        </p>
        {successRedirectHint && (
          <p className="text-xs text-[#9BA3AF]">{successRedirectHint}</p>
        )}
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <form onSubmit={confirmChange} className="space-y-4">
        {info && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center">
            {info}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="otp" className={labelClass}>Email OTP</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
              <KeyRound className="h-5 w-5" />
            </span>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              pattern="\d{6}"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className={labelClass}>New password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-new-password" className={labelClass}>Confirm new password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="confirm-new-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className={fieldClass}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#9BA3AF]">
            Use at least 8 characters with a letter and a number.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 transition active:scale-[0.98] disabled:opacity-50 text-[#0d1210] shadow-[0_0_24px_oklch(0.6_0.1_195/0.3)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.5)]"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Update password</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => requestOtp()}
          className="w-full text-sm underline underline-offset-4 hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.75 0.12 190)" }}
        >
          Resend code
        </button>
        {!compact && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setStep("request");
              setOtp("");
              setPassword("");
              setConfirmPassword("");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-xs text-[#9BA3AF] hover:text-[#D7DBE2]"
          >
            Use a different email
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="otp-email" className={labelClass}>Email</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
            <Mail className="h-5 w-5" />
          </span>
          <input
            id="otp-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || lockEmail}
            className={fieldClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 transition active:scale-[0.98] disabled:opacity-50 text-[#0d1210] shadow-[0_0_24px_oklch(0.6_0.1_195/0.3)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.5)]"
        style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Send OTP</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
