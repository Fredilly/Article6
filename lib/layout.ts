export type AppLayoutKind = "marketing" | "preview" | "readiness" | "internal";

export function getAppLayoutKind(pathname: string): AppLayoutKind {
  if (pathname.startsWith("/internal")) return "internal";
  if (pathname.startsWith("/preview/verification-readiness")) return "preview";
  if (pathname === "/sample-assessment" || pathname === "/how-it-works") return "readiness";
  return "marketing";
}
