import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRouteAccess } from "@/lib/route-access";

/**
 * Next.js 16 proxy (formerly middleware). It always runs on the Node.js runtime,
 * which the Auth.js JWT callback needs: it re-validates the session against
 * Prisma/pg, and pg cannot run on the Edge runtime.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role ?? null;

  const decision = resolveRouteAccess(pathname, { isLoggedIn, role: userRole, search });

  switch (decision.action) {
    case "allow":
      return NextResponse.next();
    case "redirect":
      return NextResponse.redirect(new URL(decision.target, req.nextUrl));
    case "json":
      return NextResponse.json(decision.body, { status: decision.status });
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ag-logo.png|images/).*)"],
};
