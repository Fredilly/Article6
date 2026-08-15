import { NextRequest, NextResponse } from "next/server";
import { createInternalSessionToken, INTERNAL_SESSION_COOKIE } from "./lib/internal-auth";

export const config = { matcher: ["/internal/:path*"] };

const SALES_AGENT_PREFIX = "/internal/sales";
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function unauthorized(message = "Authentication required.") {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Article6 internal uploads", charset="UTF-8"' },
  });
}

export default async function middleware(request: NextRequest) {
  const adminUsername = process.env.INTERNAL_UPLOAD_USERNAME;
  const adminPassword = process.env.INTERNAL_UPLOAD_PASSWORD;
  if (!adminUsername || !adminPassword) {
    return new NextResponse("Internal upload protection is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return unauthorized();

  let suppliedUsername = "";
  let suppliedPassword = "";
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator >= 0) {
      suppliedUsername = decoded.slice(0, separator);
      suppliedPassword = decoded.slice(separator + 1);
    }
  } catch {
    suppliedUsername = "";
    suppliedPassword = "";
  }

  const isAdmin = suppliedUsername === adminUsername && suppliedPassword === adminPassword;

  const agentUsername = process.env.INTERNAL_SALES_AGENT_USERNAME;
  const agentPassword = process.env.INTERNAL_SALES_AGENT_PASSWORD;
  const isSalesAgent = Boolean(
    agentUsername &&
      agentPassword &&
      suppliedUsername === agentUsername &&
      suppliedPassword === agentPassword,
  );

  if (!isAdmin && !isSalesAgent) return unauthorized("Invalid credentials.");

  if (isSalesAgent) {
    if (!request.nextUrl.pathname.startsWith(SALES_AGENT_PREFIX)) {
      return new NextResponse("Sales agent access is restricted to /internal/sales.", { status: 403 });
    }
    if (!READ_ONLY_METHODS.has(request.method)) {
      return new NextResponse("Sales agent access is read-only.", { status: 403 });
    }

    // Do not issue the admin internal-session cookie for the agent credential.
    // Mutation APIs require that admin-only cookie via hasInternalUploadSession().
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(INTERNAL_SESSION_COOKIE, await createInternalSessionToken(adminUsername, adminPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
