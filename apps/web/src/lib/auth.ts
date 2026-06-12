import { auth } from "@clerk/nextjs/server";
import { Plan } from "@prisma/client";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const DEV_FALLBACK_USER: User = {
  id: "dev-user-local",
  clerkId: "dev_local_user",
  email: "dev@hireflow.local",
  name: "Dev User",
  imageUrl: null,
  plan: Plan.PRO,
  isAdmin: true,
  onboardedAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export async function requireUser(): Promise<User> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new AuthError();

  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        email: `${clerkId}@pending.hireflow.ai`,
        plan: Plan.FREE,
      },
    });
  } catch (_e) {
    if (process.env.NODE_ENV === "production") throw new AuthError();
    return DEV_FALLBACK_USER;
  }
}

export class AuthError extends Error {
  status = 401;
  constructor() {
    super("Not authenticated");
  }
}
