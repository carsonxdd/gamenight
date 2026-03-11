import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    const signInUrl = new URL("/signup", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes require isAdmin or isModerator
  if (request.nextUrl.pathname.startsWith("/admin") && !token.isAdmin && !token.isModerator) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/polls/:path*", "/admin/:path*", "/profile/:path*", "/members/:path*", "/teams/:path*"],
};
