import { auth } from "~/server/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/", "/signin", "/signup", "/unauthorized"];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && !userRole) {
    return NextResponse.next(); // allow session hydration
  }

  if (isLoggedIn && (pathname === "/signin" || pathname === "/signup")) {
    if (userRole === "ADMIN")
      return NextResponse.redirect(new URL("/admin", req.url));
    if (userRole === "STAFF")
      return NextResponse.redirect(new URL("/staff", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const roleRank = { ADMIN: 3, STAFF: 2, USER: 1 };
  const userRank = roleRank[userRole ?? "USER"];

  if (pathname.startsWith("/admin") && userRank < 3)
    return NextResponse.redirect(new URL("/unauthorized", req.url));

  if (pathname.startsWith("/staff") && userRank < 2)
    return NextResponse.redirect(new URL("/unauthorized", req.url));

  if (pathname.startsWith("/dashboard") && userRank < 1)
    return NextResponse.redirect(new URL("/unauthorized", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next|api).*)"],
};
