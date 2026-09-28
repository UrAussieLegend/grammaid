"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Shield, ShieldOff, Trash2, UserCheck } from "lucide-react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  projects: number;
};

type Props = {
  users: AdminUser[];
  currentUserId: string;
  stats: Record<string, number>;
  config: { aiEnabled: boolean; googleEnabled: boolean };
};

const STAT_LABELS: Record<string, string> = {
  users: "Users",
  admins: "Admins",
  banned: "Banned",
  projects: "Projects",
  analyses: "Analyses",
  analysesThisWeek: "Analyses (7d)",
  aiAnalyses: "AI-powered runs",
  tokens: "Tokens used",
  words: "Words stored",
};

export function AdminPanel({ users, currentUserId, stats, config }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function patch(id: string, data: { role?: string; banned?: boolean }) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Update failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this user and all of their projects?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Delete failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const filtered = users.filter((u) =>
    `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6 pt-4">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm muted">Usage across the whole Grammaid instance.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(stats).map(([key, value], i) => (
          <div key={key} className="glass glass-hover animate-fade-up p-4" style={{ animationDelay: `${i * 45}ms` }}>
            <p className="text-[11px] uppercase tracking-wide muted">{STAT_LABELS[key] ?? key}</p>
            <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="glass animate-fade-up p-5">
        <h2 className="font-semibold">Instance configuration</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${config.aiEnabled ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
            OpenAI {config.aiEnabled ? "connected" : "not configured — heuristic engine in use"}
          </span>
          <span className={`rounded-full px-3 py-1 ${config.googleEnabled ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
            Google sign-in {config.googleEnabled ? "enabled" : "not configured"}
          </span>
        </div>
      </div>

      {error && <p className="glass px-4 py-3 text-sm text-red-500">{error}</p>}

      <div className="glass animate-fade-up p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Users</h2>
          <input
            className="input max-w-xs"
            placeholder="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide muted">
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Projects</th>
                <th className="pb-2 font-semibold">Joined</th>
                <th className="pb-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="py-3">
                    <p className="font-medium">
                      {user.name ?? "Unnamed"}
                      {user.id === currentUserId && <span className="ml-2 text-[11px] muted">(you)</span>}
                    </p>
                    <p className="text-xs muted">{user.email}</p>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${user.role === "ADMIN" ? "bg-indigo-500/15 text-indigo-500" : "bg-white/20 dark:bg-white/10"}`}>
                      {user.role}
                    </span>
                    {user.banned && <span className="ml-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-500">banned</span>}
                  </td>
                  <td className="py-3 muted">{user.projects}</td>
                  <td className="py-3 muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1.5 text-xs"
                        disabled={busyId === user.id || user.id === currentUserId}
                        onClick={() => patch(user.id, { role: user.role === "ADMIN" ? "USER" : "ADMIN" })}
                        title={user.role === "ADMIN" ? "Demote to user" : "Promote to admin"}
                      >
                        {user.role === "ADMIN" ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1.5 text-xs"
                        disabled={busyId === user.id || user.id === currentUserId}
                        onClick={() => patch(user.id, { banned: !user.banned })}
                        title={user.banned ? "Unban" : "Ban"}
                      >
                        {user.banned ? <UserCheck size={14} /> : <Ban size={14} />}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1.5 text-xs hover:text-red-500"
                        disabled={busyId === user.id || user.id === currentUserId}
                        onClick={() => remove(user.id)}
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
