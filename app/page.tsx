"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Trophy,
  MessageSquare,
  ArrowRight,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const features = [
  {
    icon: Users,
    title: "Private Communities",
    description:
      "Create invite-only spaces for your audience. Control who joins, manage members, and build tight-knit groups.",
    color: "from-purple-600 to-purple-800",
  },
  {
    icon: BookOpen,
    title: "Structured Courses",
    description:
      "Publish courses with modules and lessons. Track student progress and deliver real transformation.",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    icon: Trophy,
    title: "Wins Feed",
    description:
      "Let members celebrate victories. React, comment, and build a culture of winning together.",
    color: "from-amber-600 to-amber-800",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description:
      "Discord-style channels with threads, pinned messages, and announcements — all in one place.",
    color: "from-emerald-600 to-emerald-800",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0F1117]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Elite App</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
              The platform for serious community builders
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6"
          >
            Build Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              Community
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Everything you need to grow a thriving private community — courses,
            chat, a wins feed, and real connections. All in one beautiful
            platform.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base font-semibold rounded-xl"
              >
                Start Building Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-20 max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1D27]">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-white/30">elite-app.io/community/web-dev</span>
            </div>
            <div className="grid grid-cols-12 h-64">
              <div className="col-span-3 border-r border-white/5 p-4 space-y-3">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Web Dev Bootcamp</div>
                {["📢 Announcements", "💬 General", "📚 Courses", "🏆 Wins"].map((item) => (
                  <div key={item} className="text-sm text-white/60 py-1 px-2 rounded hover:bg-white/5 cursor-pointer">
                    {item}
                  </div>
                ))}
              </div>
              <div className="col-span-9 p-4 space-y-3">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider"># general</div>
                {[
                  { name: "Sarah K.", msg: "Just finished the JS module! 🎉", time: "2:34 PM" },
                  { name: "Teacher", msg: "Great work everyone! Next live session is Friday.", time: "2:41 PM" },
                  { name: "Mike R.", msg: "Can someone help me with async/await?", time: "3:02 PM" },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600/50 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-purple-300 mr-2">{m.name}</span>
                      <span className="text-xs text-white/30">{m.time}</span>
                      <p className="text-sm text-white/70 mt-0.5">{m.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-extrabold mb-4"
            >
              Everything you need,{" "}
              <span className="text-purple-400">nothing you don&apos;t</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/50 text-lg max-w-xl mx-auto"
            >
              A focused set of tools that work together seamlessly.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group relative rounded-2xl border border-white/5 bg-[#1A1D27] p-8 hover:border-purple-500/30 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Ready to build something{" "}
            <span className="text-purple-400">elite</span>?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-white/50 text-lg mb-10"
          >
            Join thousands of creators and educators building thriving
            communities.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-6 text-base font-semibold rounded-xl"
              >
                Create Your Community
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white/50">Elite App</span>
        </div>
        <p>© 2026 Elite App. All rights reserved.</p>
      </footer>
    </div>
  );
}
