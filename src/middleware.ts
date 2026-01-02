import { auth } from "~/server/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth");

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If logged in and on auth pages, redirect based on role
  if (isLoggedIn && (pathname === "/signin" || pathname === "/signup")) {
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (userRole === "STAFF") {
      return NextResponse.redirect(new URL("/staff", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based route protection
  if (isLoggedIn) {
    // Admin routes
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Staff routes
    if (pathname.startsWith("/staff") && userRole !== "STAFF") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // User dashboard routes
    if (pathname.startsWith("/dashboard") && userRole !== "USER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
