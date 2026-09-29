export interface AuthToken {
  id?: string;
  role?: string;
  status?: string;
  tv?: number; // tokenVersion
  chk?: number; // epoch timestamp in seconds when last verified against DB
  name?: string | null;
  image?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface DbUserAuthInfo {
  role: string;
  status: string;
  tokenVersion: number;
  name?: string | null;
  image?: string | null;
}

export interface RefreshTokenOptions {
  now?: number; // epoch ms
  revalidateSeconds?: number;
  trigger?: "signIn" | "signUp" | "update";
}

/**
 * Pure helper to refresh or invalidate a JWT token based on user status & tokenVersion.
 *
 * Rules:
 * - Missing tv (token from before Phase 2a deploy) -> return null (forces re-login).
 * - If inside the revalidation window (default 60s) and not triggered by "update", returns token unchanged.
 * - If revalidation due (or trigger === "update"), reloads user via getUser(id).
 *   - If missing, not ACTIVE, or tokenVersion changed -> return null (clears session).
 *   - Otherwise, refreshes role, name, image, status, and sets chk to current epoch seconds.
 */
export async function refreshToken(
  token: AuthToken | null | undefined,
  getUser: (userId: string) => Promise<DbUserAuthInfo | null>,
  options: RefreshTokenOptions = {},
): Promise<AuthToken | null> {
  if (!token || !token.id) {
    return null;
  }

  // Tokens without tv (issued before deployment of Phase 2a) must re-authenticate
  if (token.tv === undefined || token.tv === null) {
    return null;
  }

  const nowSec = Math.floor((options.now ?? Date.now()) / 1000);
  const lastChecked = token.chk ?? 0;
  const revalidateSec =
    options.revalidateSeconds ??
    (typeof process !== "undefined" && process.env.AUTH_REVALIDATE_SECONDS
      ? parseInt(process.env.AUTH_REVALIDATE_SECONDS, 10)
      : 60);

  // If inside revalidation window and not an explicit update, token is still valid
  if (options.trigger !== "update" && nowSec - lastChecked < revalidateSec) {
    return token;
  }

  // Reload user from database
  const user = await getUser(token.id);
  if (!user) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return null;
  }

  if (user.tokenVersion !== token.tv) {
    return null;
  }

  return {
    ...token,
    role: user.role,
    status: user.status,
    name: user.name !== undefined ? user.name : token.name,
    image: user.image !== undefined ? user.image : token.image,
    chk: nowSec,
  };
}
