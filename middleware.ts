import { NextRequest, NextResponse } from "next/server";
import { embedFrameAncestors } from "@/lib/embed-auth";

export function middleware(request: NextRequest) {
  // /embed.js is a different asset; keep this guard if the matcher ever widens.
  if (request.nextUrl.pathname === "/embed.js") {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors ${embedFrameAncestors()}`,
  );
  return response;
}

export const config = {
  matcher: ["/embed", "/embed/"],
};
