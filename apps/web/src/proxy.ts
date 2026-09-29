import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = getSessionCookie(request, { cookiePrefix: "unigym" });
  if (
    !session &&
    (pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/consent")
  ) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/profile/:path*", "/consent"] };
