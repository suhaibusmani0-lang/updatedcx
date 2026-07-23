import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
);

const AUTH_PAGES = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/verify-email"];

// Define route access levels
const ROUTE_ACCESS = {
  // Public routes - anyone can access
  public: [
    "/",
    "/new",
    "/decor",
    "/home-fragrance",
    "/bakhoor-incense",
    "/tabletop-bar",
    "/outdoor",
    "/gifts",
    "/holidays",
    "/contact",
    "/business-to-business", // 👉 Yeh line add kar di hai taaki page public ho jaye
    "/track-order",
    "/category",
    "/product",
    "/products",
    "/search",
    "/blog",
    "/about",
    "/faqs",
    "/terms-and-conditions",
    "/privacy-policy",
    "/shipping",
    "/returns",
    "/auth",
    "/api",
    "/purchase-policy",
    "/wishlist",
  ],

  // Protected routes - require authentication
  protected: [
    "/my-account",
    "/orders",
    "/wishlist",
    "/cart",
    "/profile",
    "/settings",
  ],

  // Admin routes - require admin role
  admin: [
    "/admin",
  ],
};

// Helper function to check if path matches any route in a group
function matchesRouteGroup(pathname: string, routes: string[]) {
  return routes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  // Check if it's a static asset
  const isStatic = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname) ||
                   pathname.startsWith("/_next") ||
                   pathname === "/favicon.ico";

  if (isStatic) {
    return NextResponse.next();
  }

  // Check route access level
  const isPublic = matchesRouteGroup(pathname, ROUTE_ACCESS.public);
  const isProtected = matchesRouteGroup(pathname, ROUTE_ACCESS.protected);
  const isAdmin = matchesRouteGroup(pathname, ROUTE_ACCESS.admin);

  // Handle authentication
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = payload.role as string;

      // Redirect from auth pages when logged in
      if (AUTH_PAGES.includes(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Admin check
      if (isAdmin && role !== "admin") {
        return NextResponse.redirect(new URL("/my-account", request.url));
      }

      // Allow access to all routes (user is authenticated)
      return NextResponse.next();
    } catch {
      // Invalid token - clear it
      const response = NextResponse.next();
      response.cookies.set("session", "", { maxAge: 0, path: "/" });

      // Check if the route requires authentication
      if (isProtected || isAdmin) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Allow access to public routes even with invalid token
      if (isPublic) {
        return response;
      }

      // Redirect to login for any other case
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // No token - user is not authenticated

  // Redirect to login for protected/admin routes
  if (isProtected || isAdmin) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Default: redirect to login for any other route
  return NextResponse.redirect(new URL("/auth/login", request.url));
}

// Configure matcher (middleware.ts runs on Edge runtime by default in Next.js 16)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};