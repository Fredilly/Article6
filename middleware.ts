import { NextRequest, NextResponse } from "next/server";
import { createInternalSessionToken, INTERNAL_SESSION_COOKIE } from "./lib/internal-auth";

export const config = { matcher: ["/internal/:path*"] };

export default async function middleware(request: NextRequest) {
  const username = process.env.INTERNAL_UPLOAD_USERNAME;
  const password = process.env.INTERNAL_UPLOAD_PASSWORD;
  if (!username || !password) {
    return new NextResponse("Internal upload protection is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Article6 internal uploads", charset="UTF-8"' },
    });
  }

  let suppliedUsername = "";
  let suppliedPassword = "";
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    suppliedUsername = decoded.slice(0, separator);
    suppliedPassword = decoded.slice(separator + 1);
  } catch {
    suppliedUsername = "";
  }

  if (suppliedUsername !== username || suppliedPassword !== password) {
    return new NextResponse("Invalid credentials.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Article6 internal uploads", charset="UTF-8"' },
    });
  }

  const response = NextResponse.next();
  response.cookies.set(INTERNAL_SESSION_COOKIE, await createInternalSessionToken(username, password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
