import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15000;

function hasFocusedEditor(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

export default function SalesAutoRefresh() {
  const router = useRouter();
  const refreshing = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (cancelled || refreshing.current || document.visibilityState !== "visible" || hasFocusedEditor()) return;
      refreshing.current = true;
      try {
        await router.replace(router.asPath, undefined, { scroll: false });
      } finally {
        refreshing.current = false;
      }
    };

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
