import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRouteAccess } from "@/lib/route-access";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role ?? null;

  const decision = resolveRouteAccess(pathname, { isLoggedIn, role: userRole });

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
