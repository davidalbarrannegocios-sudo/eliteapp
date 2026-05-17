"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCommunityDialog, CommunityResult } from "@/components/create-community-dialog";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Users,
  BookOpen,
  Zap,
  LogOut,
  User,
  Loader2,
  Lock,
  ArrowRight,
  ChevronRight,
  Shield,
} from "lucide-react";

interface DiscoverCommunity {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  color: string;
  inviteCode: string;
  memberCount: number;
  courseCount: number;
  owner: { name: string | null; image: string | null };
  isMember: boolean;
}

interface MyCommunity {
  id: string;
  name: string;
  description: string | null;
  color: string;
  coverImage: string | null;
  memberCount: number;
  courseCount: number;
}

const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "business", label: "Business", emoji: "💼" },
  { id: "marketing", label: "Marketing", emoji: "📣" },
  { id: "health", label: "Health", emoji: "🏃" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "self-improvement", label: "Self-improvement", emoji: "🧠" },
  { id: "languages", label: "Languages", emoji: "🌍" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "spirituality", label: "Spirituality", emoji: "🧘" },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  business: ["business", "entrepreneur", "startup", "finance", "money", "sales"],
  marketing: ["marketing", "brand", "social media", "ads", "growth", "seo"],
  health: ["health", "fitness", "nutrition", "wellness", "diet", "weight"],
  tech: ["tech", "code", "programming", "web", "dev", "software", "javascript", "python"],
  "self-improvement": ["self", "mindset", "productivity", "habit", "goal", "success"],
  languages: ["language", "spanish", "english", "french", "japanese", "chinese"],
  sports: ["sport", "football", "soccer", "basketball", "tennis", "gym"],
  spirituality: ["spiritual", "meditation", "mindfulness", "yoga", "faith", "god"],
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function CommunityCard({
  community,
  isMember,
  onJoin,
  joining,
}: {
  community: DiscoverCommunity;
  isMember: boolean;
  onJoin: (id: string) => void;
  joining: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group bg-[#1A1D27] rounded-2xl border border-white/5 hover:border-purple-500/25 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div className="relative h-28 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${community.color}55 0%, ${community.color}22 100%)`,
              borderBottom: `1px solid ${community.color}33`,
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 50%, ${community.color} 0%, transparent 60%)`,
              }}
            />
          </div>
        )}

        {/* Avatar overlapping cover */}
        <div
          className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl border-2 border-[#1A1D27] flex items-center justify-center text-sm font-bold text-white shadow-lg"
          style={{ backgroundColor: community.color }}
        >
          {getInitials(community.name)}
        </div>
      </div>

      {/* Body */}
      <div className="pt-8 px-4 pb-4 flex flex-col flex-1">
        <h3 className="font-bold text-[15px] leading-snug mb-1 truncate">{community.name}</h3>

        {community.description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-white/30 mb-4 mt-auto">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {community.memberCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {community.courseCount} course{community.courseCount !== 1 ? "s" : ""}
          </span>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-medium">
            Free
          </span>
        </div>

        {isMember ? (
          <Link href={`/community/${community.id}`}>
            <Button
              size="sm"
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs h-8"
            >
              Open
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        ) : (
          <Button
            size="sm"
            onClick={() => onJoin(community.id)}
            disabled={joining}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
          >
            {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : "Join"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function MyCommunitiesRow({ communities }: { communities: MyCommunity[] }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Your Communities</h2>
        <span className="text-sm text-white/30">{communities.length} joined</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {communities.map((c) => (
          <Link key={c.id} href={`/community/${c.id}`}>
            <div className="group flex items-center gap-3 bg-[#1A1D27] hover:bg-white/5 border border-white/5 hover:border-purple-500/25 rounded-xl p-3 transition-all cursor-pointer">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: c.color }}
              >
                {getInitials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-xs text-white/30">{c.memberCount} members</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 shrink-0 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [discover, setDiscover] = useState<DiscoverCommunity[]>([]);
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.needsRoleSelection) router.replace("/auth/role-select");
  }, [session, router]);

  // Fetch public communities for discovery
  useEffect(() => {
    fetch("/api/communities/discover")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDiscover(data);
      })
      .catch(() => {})
      .finally(() => setLoadingDiscover(false));
  }, []);

  // Fetch user's own communities
  useEffect(() => {
    if (!session?.user?.id) return;
    setLoadingMine(true);
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMyCommunities(data);
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false));
  }, [session?.user?.id]);

  // Filter discover grid by search + category
  const filtered = useMemo(() => {
    let list = discover;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") {
      const keywords = CATEGORY_KEYWORDS[activeCategory] ?? [];
      list = list.filter((c) =>
        keywords.some(
          (kw) =>
            c.name.toLowerCase().includes(kw) ||
            c.description?.toLowerCase().includes(kw)
        )
      );
    }
    return list;
  }, [discover, search, activeCategory]);

  const handleJoinById = async (communityId: string) => {
    if (!session?.user?.id) {
      router.push("/auth/login");
      return;
    }
    const community = discover.find((c) => c.id === communityId);
    if (!community) return;
    setJoiningId(communityId);
    const res = await fetch(`/api/join/${community.inviteCode}`, { method: "POST" });
    const json = await res.json();
    setJoiningId(null);
    if (!res.ok && json.error !== "Already a member") {
      toast.error(json.error || "Failed to join");
      return;
    }
    toast.success(`Joined ${community.name}!`);
    // Mark as member in discover list
    setDiscover((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, isMember: true } : c))
    );
    setMyCommunities((prev) => [
      {
        id: community.id,
        name: community.name,
        description: community.description,
        color: community.color,
        coverImage: community.coverImage,
        memberCount: community.memberCount + 1,
        courseCount: community.courseCount,
      },
      ...prev.filter((c) => c.id !== communityId),
    ]);
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    setJoiningCode(true);
    const res = await fetch(`/api/join/${inviteCode.trim()}`, { method: "POST" });
    const json = await res.json();
    setJoiningCode(false);
    if (!res.ok) {
      if (json.error === "Already a member") {
        router.push(`/community/${json.communityId}`);
        return;
      }
      toast.error(json.error || "Invalid invite code");
      return;
    }
    toast.success("Joined community!");
    setShowInviteModal(false);
    router.push(`/community/${json.communityId}`);
  };

  const handleCreated = (community: CommunityResult) => {
    const newEntry: MyCommunity = {
      id: community.id,
      name: community.name,
      description: community.description,
      color: community.color,
      coverImage: null,
      memberCount: community.memberCount,
      courseCount: community.courseCount,
    };
    setMyCommunities((prev) => [newEntry, ...prev]);
    if (!community.inviteCode) return;
    setDiscover((prev) => [
      {
        ...community,
        coverImage: null,
        owner: { name: session?.user?.name ?? null, image: session?.user?.image ?? null },
        isMember: true,
      } as DiscoverCommunity,
      ...prev,
    ]);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-40 bg-[#0F1117]/90 backdrop-blur-md border-b border-white/5 px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Elite App</span>
        </Link>

        <div className="flex items-center gap-3">
          {(session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN") && (
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Community
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1A1D27] border-white/10 text-white w-44">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-white/30 capitalize">{session?.user?.role?.toLowerCase()}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push("/profile")} className="flex items-center gap-2 cursor-pointer mt-1">
                <User className="w-3.5 h-3.5" /> Profile
              </DropdownMenuItem>
              {session?.user?.role === "ADMIN" && (
                <DropdownMenuItem onClick={() => router.push("/admin")} className="flex items-center gap-2 cursor-pointer text-purple-400 hover:text-purple-300">
                  <Shield className="w-3.5 h-3.5" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* ── Hero search ── */}
      <div className="relative bg-gradient-to-b from-purple-950/30 to-transparent pt-14 pb-10 px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
            Discover Communities
          </h1>
          <p className="text-white/40 text-sm mb-7">
            Find your people. Join a community. Level up together.
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1D27] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* ── Category pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Your communities ── */}
        {!loadingMine && myCommunities.length > 0 && (
          <MyCommunitiesRow communities={myCommunities} />
        )}

        {/* ── Discover heading ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">
              {search
                ? `Results for "${search}"`
                : activeCategory !== "all"
                ? CATEGORIES.find((c) => c.id === activeCategory)?.label + " Communities"
                : "All Communities"}
            </h2>
            {!loadingDiscover && (
              <p className="text-xs text-white/30 mt-0.5">
                {filtered.length} communit{filtered.length !== 1 ? "ies" : "y"}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Lock className="w-3 h-3" />
            Have an invite code?
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* ── Discover grid ── */}
        {loadingDiscover ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1A1D27] rounded-2xl border border-white/5 h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-2">No communities found</h3>
            <p className="text-white/40 text-sm">
              {search ? `No results for "${search}"` : "No public communities yet."}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isMember={community.isMember}
                  onJoin={handleJoinById}
                  joining={joiningId === community.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Invite code modal ── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              Join a Private Community
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-white/40">
              Enter the invite code shared by the community owner.
            </p>
            <input
              type="text"
              placeholder="Paste invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!inviteCode.trim() || joiningCode}
                onClick={handleJoinByCode}
              >
                {joiningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create community dialog ── */}
      <CreateCommunityDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
