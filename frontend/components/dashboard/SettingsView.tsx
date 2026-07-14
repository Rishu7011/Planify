"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

import { apiFetch } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { ChangePasswordOtpForm } from "@/components/auth/ChangePasswordOtpForm";

export type WorkspaceProfile = {
  organization_id: string;
  name: string;
  plan_tier: string;
  role: string;
  created_at?: string | null;
};

export type MeResponse = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
  workspace: WorkspaceProfile | null;
};

type SettingsViewProps = {
  accessToken?: string;
  sessionName?: string | null;
  sessionEmail?: string | null;
  sessionImage?: string | null;
  initials: string;
  projectCount: number;
  reportCount: number;
};

type Prefs = {
  emailDigest: boolean;
  productTips: boolean;
  runAlerts: boolean;
  compactSidebar: boolean;
};

const PREF_KEY = "planify.settings.prefs";

const DEFAULT_PREFS: Prefs = {
  emailDigest: true,
  productTips: true,
  runAlerts: true,
  compactSidebar: false,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: Prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
        checked ? "bg-[#aec6ff]" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SettingsView({
  accessToken,
  sessionName,
  sessionEmail,
  sessionImage,
  initials,
  projectCount,
  reportCount,
}: SettingsViewProps) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceMsg, setWorkspaceMsg] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<MeResponse>("/auth/me", { accessToken });
        if (cancelled) return;
        setMe(data);
        setWorkspaceName(data.workspace?.name || "");
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.detail || "Could not load account settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const displayName = me?.user?.name || sessionName || "Your account";
  const displayEmail = me?.user?.email || sessionEmail || "—";
  const plan = me?.workspace?.plan_tier || "free";
  const role = me?.workspace?.role || "OWNER";

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    setPrefsSaved(true);
    window.setTimeout(() => setPrefsSaved(false), 1600);
  };

  const saveWorkspace = async () => {
    if (!accessToken) return;
    const name = workspaceName.trim();
    if (!name) {
      setWorkspaceMsg("Name can’t be empty.");
      return;
    }
    setSavingWorkspace(true);
    setWorkspaceMsg(null);
    try {
      await apiFetch("/auth/workspace", {
        accessToken,
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setMe((prev) =>
        prev
          ? {
              ...prev,
              workspace: prev.workspace
                ? { ...prev.workspace, name }
                : prev.workspace,
            }
          : prev,
      );
      setWorkspaceMsg("Workspace name saved.");
    } catch (err: any) {
      setWorkspaceMsg(err?.detail || "Could not save workspace name.");
    } finally {
      setSavingWorkspace(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aec6ff]">
          Account
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F8FC]">
          Settings
        </h1>
        <p className="text-sm text-[#7C869A] leading-relaxed max-w-xl">
          Manage your profile, workspace, and notification preferences.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Profile */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#151A2B] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F7F8FC]">Profile</h2>
          {loading && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A] animate-pulse">
              Loading
            </span>
          )}
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-6 sm:items-center">
          {sessionImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sessionImage}
              alt=""
              className="w-16 h-16 rounded-2xl border border-white/10 object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#aec6ff]/15 border border-[#aec6ff]/25 text-[#aec6ff] flex items-center justify-center text-lg font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-lg font-bold text-[#F7F8FC] truncate">{displayName}</p>
            <p className="text-sm text-[#7C869A] truncate">{displayEmail}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center rounded-full border border-[#aec6ff]/25 bg-[#aec6ff]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#aec6ff]">
                {plan} plan
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B4BCCB]">
                {role}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-48 shrink-0">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-[#F7F8FC]">{projectCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                Projects
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-[#F7F8FC]">{reportCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                Reports
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#151A2B]">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-[#F7F8FC]">Workspace</h2>
          <p className="text-xs text-[#7C869A] mt-1">
            Your personal Planify workspace used across projects and assets.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#7C869A] mb-2"
            >
              Workspace name
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={loading || !me?.workspace || savingWorkspace}
                maxLength={80}
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-[#F7F8FC] outline-none focus:border-[#aec6ff]/40 disabled:opacity-50"
                placeholder="My Workspace"
              />
              <button
                type="button"
                onClick={saveWorkspace}
                disabled={loading || !me?.workspace || savingWorkspace}
                className="h-11 px-5 rounded-xl bg-[#aec6ff] text-[#00275e] text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {savingWorkspace ? "Saving…" : "Save"}
              </button>
            </div>
            {workspaceMsg && (
              <p className="mt-2 text-xs text-[#B4BCCB]">{workspaceMsg}</p>
            )}
          </div>
          {me?.workspace && (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                  Organization ID
                </dt>
                <dd className="mt-1 font-mono text-xs text-[#B4BCCB] truncate">
                  {me.workspace.organization_id}
                </dd>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                  Created
                </dt>
                <dd className="mt-1 text-[#B4BCCB]">
                  {me.workspace.created_at
                    ? new Date(me.workspace.created_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* Preferences */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#151A2B]">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#F7F8FC]">Preferences</h2>
            <p className="text-xs text-[#7C869A] mt-1">
              Stored locally in this browser for now.
            </p>
          </div>
          {prefsSaved && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Saved
            </span>
          )}
        </div>
        <ul className="divide-y divide-white/[0.05]">
          {(
            [
              {
                key: "emailDigest" as const,
                title: "Weekly digest",
                desc: "Summary of project activity and new reports.",
              },
              {
                key: "productTips" as const,
                title: "Product tips",
                desc: "Occasional coaching cues in the workspace.",
              },
              {
                key: "runAlerts" as const,
                title: "AI run alerts",
                desc: "Notify when a long-running workflow finishes.",
              },
              {
                key: "compactSidebar" as const,
                title: "Prefer compact sidebar",
                desc: "Remember collapsed sidebar as your default on desktop.",
              },
            ]
          ).map((item) => (
            <li
              key={item.key}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F7F8FC]">{item.title}</p>
                <p className="text-xs text-[#7C869A] mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={prefs[item.key]}
                onChange={(v) => updatePref(item.key, v)}
                label={item.title}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Change password via email OTP */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#151A2B]">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-[#F7F8FC]">Change password</h2>
          <p className="text-xs text-[#7C869A] mt-1">
            We&apos;ll send a 6-digit OTP to your email, then you can set a new password.
          </p>
        </div>
        <div className="p-6">
          {displayEmail && displayEmail !== "—" ? (
            <ChangePasswordOtpForm
              defaultEmail={displayEmail}
              lockEmail
              compact
              successRedirectHint="Your new password is ready for the next sign-in."
            />
          ) : (
            <p className="text-sm text-[#7C869A]">
              No email on this account. Use forgot password from the login page after adding an email.
            </p>
          )}
        </div>
      </section>

      {/* Danger / session */}
      <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04]">
        <div className="px-6 py-4 border-b border-rose-500/10">
          <h2 className="text-sm font-bold text-[#F7F8FC]">Session</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[#B4BCCB]">
            Sign out of Planify on this device. Your projects stay in the cloud.
          </p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: ROUTES.home })}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-bold hover:bg-rose-500/20 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
