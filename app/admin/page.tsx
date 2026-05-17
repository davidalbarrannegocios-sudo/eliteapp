"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Globe,
  BookOpen,
  MessageSquare,
  Zap,
  ArrowLeft,
  Trash2,
  Shield,
  Settings,
  Loader2,
  Ban,
  CheckCircle,
} from "lucide-react";

interface Stats { users: number; communities: number; courses: number; messages: number }
interface AdminUser {
  id: string; name: string | null; email: string; role: string;
  isBanned: boolean; createdAt: string; _count: { memberships: number };
}
interface AdminCommunity {
  id: string; name: string; isPrivate: boolean;
  owner: { name: string | null; email: string };
  memberCount: number; courseCount: number; createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-600/20 text-purple-300 border-purple-500/30",
  TEACHER: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  STUDENT: "bg-white/5 text-white/50 border-white/10",
};

const TABS = ["Overview", "Users", "Communities", "Settings"] as const;
type Tab = typeof TABS[number];

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-extrabold mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [teacherCode, setTeacherCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [deletingCommunity, setDeletingCommunity] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "Users" && users.length === 0) {
      setLoadingUsers(true);
      fetch("/api/admin/users").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setUsers(data);
      }).finally(() => setLoadingUsers(false));
    }
    if (activeTab === "Communities" && communities.length === 0) {
      setLoadingCommunities(true);
      fetch("/api/admin/communities").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCommunities(data);
      }).finally(() => setLoadingCommunities(false));
    }
    if (activeTab === "Settings") {
      fetch("/api/admin/settings").then(r => r.json()).then(d => {
        if (d.teacherInviteCode) setTeacherCode(d.teacherInviteCode);
      });
    }
  }, [activeTab]);

  const updateUser = async (userId: string, patch: { role?: string; isBanned?: boolean }) => {
    setUpdatingUser(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setUpdatingUser(null);
    if (!res.ok) { toast.error(json.error || "Failed to update"); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...json } : u));
    toast.success("User updated");
  };

  const deleteCommunity = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingCommunity(id);
    const res = await fetch(`/api/admin/communities/${id}`, { method: "DELETE" });
    setDeletingCommunity(null);
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setCommunities(prev => prev.filter(c => c.id !== id));
    toast.success(`"${name}" deleted`);
  };

  const saveCode = async () => {
    if (!teacherCode.trim()) return;
    setSavingCode(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherInviteCode: teacherCode }),
    });
    const json = await res.json();
    setSavingCode(false);
    if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
    toast.success("Teacher code updated");
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#0F1117]/90 backdrop-blur-md border-b border-white/5 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <span>{session?.user?.name}</span>
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">Admin</Badge>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-extrabold mb-6">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Users" value={stats?.users ?? 0} color="bg-purple-600/20 text-purple-400" />
              <StatCard icon={Globe} label="Communities" value={stats?.communities ?? 0} color="bg-blue-600/20 text-blue-400" />
              <StatCard icon={BookOpen} label="Courses" value={stats?.courses ?? 0} color="bg-emerald-600/20 text-emerald-400" />
              <StatCard icon={MessageSquare} label="Messages" value={stats?.messages ?? 0} color="bg-amber-600/20 text-amber-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { tab: "Users" as Tab, icon: Users, label: "Manage Users", desc: "Change roles, ban users" },
                { tab: "Communities" as Tab, icon: Globe, label: "Manage Communities", desc: "View and delete communities" },
                { tab: "Settings" as Tab, icon: Settings, label: "Settings", desc: "Change teacher invite code" },
              ].map(({ tab, icon: Icon, label, desc }) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="bg-[#1A1D27] border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 text-left transition-all group">
                  <Icon className="w-5 h-5 text-purple-400 mb-3" />
                  <p className="font-semibold mb-1">{label}</p>
                  <p className="text-sm text-white/40">{desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Users ── */}
        {activeTab === "Users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold">Users</h1>
              <span className="text-sm text-white/30">{users.length} total</span>
            </div>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="bg-[#1A1D27] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Joined</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Communities</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSelf = user.id === session?.user?.id;
                      return (
                        <tr key={user.id} className={`border-b border-white/5 last:border-0 ${user.isBanned ? "opacity-50" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="bg-purple-600/30 text-purple-300 text-xs">
                                  {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{user.name ?? "—"}</p>
                                <p className="text-white/30 text-xs truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-white/40 hidden md:table-cell">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-white/40 hidden sm:table-cell">
                            {user._count.memberships}
                          </td>
                          <td className="px-5 py-3">
                            {isSelf ? (
                              <Badge className={`text-xs border ${ROLE_COLORS[user.role]}`}>{user.role}</Badge>
                            ) : (
                              <Select
                                value={user.role}
                                onValueChange={(role) => role && updateUser(user.id, { role })}
                                disabled={updatingUser === user.id}
                              >
                                <SelectTrigger className="h-7 w-28 bg-white/5 border-white/10 text-white text-xs focus:ring-purple-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1D27] border-white/10 text-white">
                                  <SelectItem value="STUDENT" className="text-xs">Student</SelectItem>
                                  <SelectItem value="TEACHER" className="text-xs">Teacher</SelectItem>
                                  <SelectItem value="ADMIN" className="text-xs">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {isSelf ? (
                              <span className="text-xs text-white/20">—</span>
                            ) : updatingUser === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            ) : user.isBanned ? (
                              <button
                                onClick={() => updateUser(user.id, { isBanned: false })}
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => updateUser(user.id, { isBanned: true })}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" /> Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Communities ── */}
        {activeTab === "Communities" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold">Communities</h1>
              <span className="text-sm text-white/30">{communities.length} total</span>
            </div>
            {loadingCommunities ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="bg-[#1A1D27] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Community</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Owner</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Members</th>
                      <th className="text-left px-5 py-3 hidden lg:table-cell">Created</th>
                      <th className="text-left px-5 py-3">Type</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {communities.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-white/30">{c.courseCount} course{c.courseCount !== 1 ? "s" : ""}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-white/40 hidden md:table-cell">
                          <p className="truncate max-w-[140px]">{c.owner.name ?? c.owner.email}</p>
                          <p className="text-xs text-white/20 truncate max-w-[140px]">{c.owner.email}</p>
                        </td>
                        <td className="px-5 py-3 text-white/40 hidden sm:table-cell">{c.memberCount}</td>
                        <td className="px-5 py-3 text-white/40 hidden lg:table-cell">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={`text-xs border ${c.isPrivate ? "bg-white/5 text-white/40 border-white/10" : "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"}`}>
                            {c.isPrivate ? "Private" : "Public"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => deleteCommunity(c.id, c.name)}
                            disabled={deletingCommunity === c.id}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                          >
                            {deletingCommunity === c.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Settings ── */}
        {activeTab === "Settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-extrabold mb-6">Settings</h1>
            <div className="max-w-lg space-y-6">
              <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <h2 className="font-bold">Teacher Invite Code</h2>
                </div>
                <p className="text-sm text-white/40 mb-5">
                  New users who enter this code during registration will receive the Teacher role.
                  Currently active on the registration page.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="Enter new code..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 font-mono tracking-widest"
                  />
                  <Button
                    onClick={saveCode}
                    disabled={!teacherCode.trim() || savingCode}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {savingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-white/20 mt-3">
                  Changes take effect immediately. The new code overrides the TEACHER_INVITE_CODE env variable.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
