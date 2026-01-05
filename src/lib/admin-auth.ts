import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { admins } from "@/data/schema";
import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  adminId: string;
  name?: string | null;
  username: string;
  loginTime: number;
}

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; id?: string; name?: string | null }> {
  try {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username) && isNull(admins.deletedAt))
      .limit(1);

    if (!admin) {
      return { valid: false };
    }

    const isValidPassword = await bcrypt.compare(password, admin?.passwordHash);

    if (!isValidPassword) {
      return { valid: false };
    }

    return { valid: true, id: admin?.id, name: admin?.name };
  } catch (error) {
    console.error("Error validating admin credentials:", error);
    return { valid: false };
  }
}

export async function createAdminSession(
  adminId: string,
  username: string,
  name?: string | null
): Promise<void> {
  const session: AdminSession = {
    adminId,
    username,
    name,
    loginTime: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionCookie.value);

    // Check if session has expired
    const now = Date.now();
    const sessionAge = now - session.loginTime;

    if (sessionAge > SESSION_DURATION) {
      await clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error parsing admin session:", error);
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
