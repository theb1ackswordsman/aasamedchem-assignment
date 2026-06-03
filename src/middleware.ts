import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const path = req.nextUrl.pathname;

    // Check if the user is trying to access an admin path
    if (path.startsWith("/admin") && role !== "admin") {
      if (role === "seller") {
        return NextResponse.redirect(new URL("/seller/browse", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if the user is trying to access a seller path
    if (path.startsWith("/seller") && role !== "seller") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*"],
};
