import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  console.log("Middleware running for:", req.nextUrl.pathname);

  if (pathname.startsWith("/signin")) {
    return NextResponse.next();
  }

  if (
    !req.auth &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }
  if (req.auth?.user && (req.auth.user as any).role === "ADMIN") {
    // Avoid redirect loops: do not redirect if already under /admin
    const alreadyInAdmin =
      pathname === "/admin" || pathname.startsWith("/admin/");
    const atDashboardRoot =
      pathname === "/dashboard" || pathname === "/dashboard/";
    if (!alreadyInAdmin && atDashboardRoot) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/signin"],
};
