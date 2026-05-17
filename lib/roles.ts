import { Role } from "@prisma/client";

export const isTeacherOrAdmin = (role: Role | string) =>
  role === "TEACHER" || role === "ADMIN";

export const isAdmin = (role: Role | string) => role === "ADMIN";
