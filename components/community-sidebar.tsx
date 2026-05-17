"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone,
  Hash,
  BookOpen,
  Trophy,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  color: string;
  ownerId: string;
}

interface CommunitySidebarProps {
  community: Community;
}

export function CommunitySidebar({ community }: CommunitySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isOwner = session?.user?.id === community.ownerId;

  const navItems = [
    {
      href: `/community/${community.id}/announcements`,
      label: "Announcements",
      icon: Megaphone,
    },
    {
      href: `/community/${community.id}/channels`,
      label: "Channels",
      icon: Hash,
    },
    {
      href: `/community/${community.id}/courses`,
      label: "Courses",
      icon: BookOpen,
    },
    {
      href: `/community/${community.id}/wins`,
      label: "Wins",
      icon: Trophy,
    },
    {
      href: `/community/${community.id}/members`,
      label: "Members",
      icon: Users,
    },
    ...(isOwner
      ? [
          {
            href: `/community/${community.id}/settings`,
            label: "Settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  const initials = community.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-64 bg-[#111318] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40"
    >
      {/* Community Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: community.color }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{community.name}</p>
            {isOwner && (
              <p className="text-xs text-purple-400">Owner</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-purple-600/20 text-purple-300"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all bg-transparent border-none outline-none cursor-pointer"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="bg-purple-600 text-white text-xs">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-white/30 truncate">
                {session?.user?.role === "ADMIN" ? "Admin" : session?.user?.role === "TEACHER" ? "Teacher" : "Student"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="bg-[#1A1D27] border-white/10 text-white w-48"
          >
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            {session?.user?.role === "ADMIN" && (
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 cursor-pointer text-purple-400 hover:text-purple-300"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
