import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.lessonProgress.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.winComment.deleteMany();
  await prisma.win.deleteMany();
  await prisma.message.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.community.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  const studentPassword = await bcrypt.hash("student123", 12);

  // Upsert admin user (preserves existing data if already present)
  await prisma.user.upsert({
    where: { email: "albarranjimenezd@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      name: "David Admin",
      email: "albarranjimenezd@gmail.com",
      role: "ADMIN",
    },
  });
  console.log("✅ Ensured admin: albarranjimenezd@gmail.com");

  const teacher = await prisma.user.create({
    data: {
      name: "Alex Teacher",
      email: "teacher@elite.app",
      password: teacherPassword,
      role: "TEACHER",
    },
  });
  console.log("✅ Created teacher:", teacher.email);

  const student1 = await prisma.user.create({
    data: {
      name: "Sarah Student",
      email: "student1@elite.app",
      password: studentPassword,
      role: "STUDENT",
    },
  });
  console.log("✅ Created student1:", student1.email);

  const student2 = await prisma.user.create({
    data: {
      name: "Mike Learner",
      email: "student2@elite.app",
      password: studentPassword,
      role: "STUDENT",
    },
  });
  console.log("✅ Created student2:", student2.email);

  // Create community
  const community = await prisma.community.create({
    data: {
      name: "Web Dev Bootcamp",
      description:
        "Learn modern web development from scratch. HTML, CSS, JavaScript, React, and beyond.",
      color: "#7C3AED",
      ownerId: teacher.id,
    },
  });
  console.log("✅ Created community:", community.name);

  // Add teacher as member
  await prisma.membership.create({
    data: { userId: teacher.id, communityId: community.id },
  });

  // Add students as members
  await prisma.membership.create({
    data: { userId: student1.id, communityId: community.id },
  });
  await prisma.membership.create({
    data: { userId: student2.id, communityId: community.id },
  });
  console.log("✅ Added members");

  // Create channels
  const announcementsChannel = await prisma.channel.create({
    data: {
      name: "announcements",
      type: "ANNOUNCEMENT",
      communityId: community.id,
    },
  });

  const generalChannel = await prisma.channel.create({
    data: {
      name: "general",
      type: "TEXT",
      communityId: community.id,
    },
  });
  console.log("✅ Created channels");

  // Seed messages
  await prisma.message.create({
    data: {
      content:
        "🎉 Welcome to the Web Dev Bootcamp! We're excited to have you here. Please introduce yourself in #general.",
      userId: teacher.id,
      channelId: announcementsChannel.id,
      isPinned: true,
    },
  });

  await prisma.message.create({
    data: {
      content:
        "📚 Curriculum update: We've added a new React module! Check it out in the Courses section.",
      userId: teacher.id,
      channelId: announcementsChannel.id,
    },
  });

  await prisma.message.create({
    data: {
      content:
        "Hey everyone! I'm Sarah, a frontend developer looking to level up my skills. Excited to be here!",
      userId: student1.id,
      channelId: generalChannel.id,
    },
  });

  await prisma.message.create({
    data: {
      content:
        "Hi! I'm Mike, switching careers from marketing. This looks amazing!",
      userId: student2.id,
      channelId: generalChannel.id,
    },
  });
  console.log("✅ Created messages");

  // Create course
  const course = await prisma.course.create({
    data: {
      title: "JavaScript Fundamentals",
      description:
        "Master the building blocks of JavaScript — variables, functions, arrays, objects, and modern ES6+ features.",
      communityId: community.id,
    },
  });
  console.log("✅ Created course:", course.title);

  // Create modules
  const module1 = await prisma.module.create({
    data: {
      title: "Getting Started",
      courseId: course.id,
      order: 0,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: "Core Concepts",
      courseId: course.id,
      order: 1,
    },
  });
  console.log("✅ Created modules");

  // Create lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      title: "Introduction to JavaScript",
      content:
        "<h2>What is JavaScript?</h2><p>JavaScript is a lightweight, interpreted programming language with first-class functions.</p>",
      videoUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
      moduleId: module1.id,
      order: 0,
    },
  });

  await prisma.lesson.create({
    data: {
      title: "Setting Up Your Environment",
      content:
        "<h2>Tools You Need</h2><p>Before writing JavaScript, let's set up a proper development environment.</p>",
      moduleId: module1.id,
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      title: "Variables and Data Types",
      content:
        "<h2>Variables</h2><p>Variables are containers for storing data values.</p>",
      videoUrl: "https://www.youtube.com/watch?v=edlFjlzxkSI",
      moduleId: module2.id,
      order: 0,
    },
  });
  console.log("✅ Created lessons");

  // Mark lesson 1 as completed for student1
  await prisma.lessonProgress.create({
    data: { userId: student1.id, lessonId: lesson1.id },
  });

  // Create a win
  const win = await prisma.win.create({
    data: {
      title: "Finished my first JavaScript project!",
      description:
        "Just built a fully functional todo app using vanilla JavaScript. Never thought I'd get here so fast!",
      userId: student1.id,
      communityId: community.id,
    },
  });

  // Add reactions to the win
  await prisma.reaction.create({
    data: { emoji: "🔥", userId: teacher.id, winId: win.id },
  });
  await prisma.reaction.create({
    data: { emoji: "💪", userId: student2.id, winId: win.id },
  });
  await prisma.reaction.create({
    data: { emoji: "🎉", userId: teacher.id, winId: win.id },
  });
  console.log("✅ Created wins and reactions");

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("  Teacher:  teacher@elite.app / teacher123");
  console.log("  Student1: student1@elite.app / student123");
  console.log("  Student2: student2@elite.app / student123");
  console.log(`\n  Community invite code: ${community.inviteCode}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
