import { auth } from "~/server/auth";

export default auth((req) => {
  console.log("Middleware running for:", req.nextUrl.pathname);

  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/signin", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
