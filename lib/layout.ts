export type AppLayoutKind = "marketing" | "preview" | "internal";

export function getAppLayoutKind(pathname: string): AppLayoutKind {
  if (pathname.startsWith("/internal")) return "internal";
  if (pathname.startsWith("/preview/verification-readiness")) return "preview";
  return "marketing";
}
