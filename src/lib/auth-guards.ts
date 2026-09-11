import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAuthState } from "@/lib/auth-state";
import { type UserRole } from "@/lib/constants";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: string;
  tokenVersion: number;
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
}

/**
 * Authoritative session check for server actions and route handlers.
 * Checks tokenVersion and status directly against the database via getAuthState,
 * closing the 60-second revalidation window.
 */
export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const dbUser = await getAuthState(session.user.id);
  if (!dbUser || dbUser.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }

  const sessionTv = (session.user as { tokenVersion?: number }).tokenVersion;
  if (sessionTv !== undefined && sessionTv !== null && dbUser.tokenVersion !== sessionTv) {
    throw new Error("Unauthorized");
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image || dbUser.profilePhoto,
      role: dbUser.role as UserRole,
      status: dbUser.status,
      tokenVersion: dbUser.tokenVersion,
    },
  };
}

/**
 * Authoritative role check for server actions and route handlers.
 * Ensures the user has an active session and matches one of allowedRoles according to the database.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * Page-friendly role guard that redirects instead of throwing.
 * Useful for server component page wrappers.
 */
export async function requirePageRole(
  allowedRoles: UserRole[],
  redirectTo = "/login",
): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(redirectTo);
    return null as never;
  }

  const dbUser = await getAuthState(session.user.id);
  if (!dbUser || dbUser.status !== "ACTIVE") {
    redirect(redirectTo);
    return null as never;
  }

  const sessionTv = (session.user as { tokenVersion?: number }).tokenVersion;
  if (sessionTv !== undefined && sessionTv !== null && dbUser.tokenVersion !== sessionTv) {
    redirect(redirectTo);
    return null as never;
  }

  if (!allowedRoles.includes(dbUser.role as UserRole)) {
    redirect("/dashboard");
    return null as never;
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image || dbUser.profilePhoto,
      role: dbUser.role as UserRole,
      status: dbUser.status,
      tokenVersion: dbUser.tokenVersion,
    },
  };
}
