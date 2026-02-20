import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApiRoute = path.startsWith("/api/");

  // Public routes - allow all (including verify-email page)
  if (
    path.startsWith("/auth") ||
    path === "/" ||
    path.startsWith("/jobs") ||
    path.startsWith("/talents") ||
    path.startsWith("/api/jobs") ||
    path.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Admin routes require admin role (except setup page)
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    // Allow access to admin setup page without authentication
    if (path === "/admin/setup" || path === "/api/admin/setup") {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    const userRole = (token as any).role;
    if (userRole !== "ADMIN") {
      if (!isApiRoute) {
        if (userRole === "DIRECTOR") {
          return NextResponse.redirect(new URL("/director/dashboard", req.url));
        }
        if (userRole === "TALENT") {
          return NextResponse.redirect(new URL("/talent/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // Protected routes require authentication
  if (
    path.startsWith("/director") ||
    path.startsWith("/talent") ||
    path.startsWith("/api/director") ||
    path.startsWith("/api/talent") ||
    path.startsWith("/api/apply") ||
    path.startsWith("/api/messages")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    // Email verification enforcement
    const emailVerified = (token as any).emailVerified;
    if (!emailVerified) {
      // Allow access to auth routes and resend verification API
      if (path.startsWith("/api/auth/resend-verification")) {
        return NextResponse.next();
      }
      // Redirect unverified users to the OTP send page instead of the old verify-email page
      return NextResponse.redirect(new URL("/auth/send-otp", req.url));
    }

    // Role-based redirection
    const userRole = (token as any).role;
    if (userRole === "DIRECTOR" && path.startsWith("/talent")) {
      return NextResponse.redirect(new URL("/director/dashboard", req.url));
    }

    if (userRole === "TALENT" && path.startsWith("/director")) {
      return NextResponse.redirect(new URL("/talent/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/director/:path*",
    "/talent/:path*",
    "/api/admin/:path*",
    "/api/director/:path*",
    "/api/talent/:path*",
    "/api/apply/:path*",
    "/api/messages/:path*",
  ],
};

