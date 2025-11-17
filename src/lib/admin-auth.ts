import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  username: string;
  loginTime: number;
}

export function validateAdminCredentials(
  username: string,
  password: string
): boolean {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  return username === adminUsername && password === adminPassword;
}

export async function createAdminSession(username: string): Promise<void> {
  const session: AdminSession = {
    username,
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
