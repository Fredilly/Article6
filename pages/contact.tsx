import { useEffect, useRef } from "react";
import Script from "next/script";
import Head from "next/head";

declare global {
  interface Window {
    hbspt?: { forms?: { create?: (opts: Record<string, any>) => void } };
  }
}

export default function Contact() {
  const createdRef = useRef(false);

  useEffect(() => {
    const init = () => {
      if (createdRef.current) return;
      if (window.hbspt?.forms?.create) {
        window.hbspt.forms.create({
          region: "eu1",
          portalId: "146230713",
          formId: "d19a1261-38af-47d2-a668-bfb5b3b24cd5",
          target: "#hs-contact-form",
          css: "",
        });
        createdRef.current = true;
      }
    };
    init();
    const onLoaded = () => init();
    document.addEventListener("hsforms:loaded", onLoaded);

    const poll = setInterval(() => {
      const iframe = document.querySelector("#hs-contact-form iframe");
      const fb = document.getElementById("hs-contact-fallback");
      if (iframe && fb) fb.classList.add("hidden");
    }, 250);
    const timeout = setTimeout(() => clearInterval(poll), 6000);

    return () => {
      document.removeEventListener("hsforms:loaded", onLoaded);
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-10 md:py-14">
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self';",
            "base-uri 'self'; form-action 'self' https://forms-eu1.hsforms.com https://share.hsforms.com;",
            "script-src 'self' https://js-eu1.hsforms.net;",
            "frame-src 'self' https://forms-eu1.hsforms.com https://share.hsforms.com;",
            "img-src 'self' data: https://forms-eu1.hsforms.com https://forms.hsforms.com https://ik.imagekit.io;",
            "style-src 'self' 'unsafe-inline' https://forms-eu1.hsforms.com https://forms.hsforms.com;",
            "object-src 'none'; connect-src 'self';",
          ].join(" ")}
        />
        <title>Contact • Article6</title>
      </Head>

      <Script
        id="hsforms-v2"
        src="https://js-eu1.hsforms.net/forms/embed/v2.js"
        strategy="afterInteractive"
        onLoad={() => document.dispatchEvent(new Event("hsforms:loaded"))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Contact Article6</h1>
          <p className="mt-3 text-gray-600">We typically respond within 1–2 business days.</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 min-h-[560px]">
          <div id="hs-contact-form" className="min-h-[540px]" />
          <div id="hs-contact-fallback" className="block mt-4 text-sm text-gray-700">
            If the form doesn’t load, please use our{" "}
            <a
              className="underline"
              href="https://share.hsforms.com/eu1/d19a1261-38af-47d2-a668-bfb5b3b24cd5?portalId=146230713"
              target="_blank"
              rel="noreferrer"
            >
              contact form
            </a>{" "}
            or email <a className="underline" href="mailto:hello@article6.org">hello@article6.org</a>.
          </div>
        </section>
      </div>
    </main>
  );
}

