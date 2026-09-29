"use server";

import { signOut } from "@/lib/auth";

/**
 * Signs the current user out and returns them to the login page.
 * Used as a form action, so Next's built-in server-action protections apply
 * (a bare POST to /api/auth/signout without a CSRF token only shows Auth.js's
 * confirmation page).
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
