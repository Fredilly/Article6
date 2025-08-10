import Head from "next/head";
import Script from "next/script";
import { useEffect, useRef } from "react";

export default function ContactPage() {
  const mountedRef = useRef(false);

  useEffect(() => {
    // Guard against double init on Fast Refresh
    if (mountedRef.current) return;
    mountedRef.current = true;

    const init = () => {
      // @ts-ignore
      if (window.hbspt?.forms?.create) {
        // @ts-ignore
        window.hbspt.forms.create({
          region: "eu1",
          portalId: "146230713",
          formId: "d19a1261-38af-47d2-a668-bfb5b3b24cd5",
          target: "#hs-contact-form",
          css: "",
        });
      }
    };

    let onLoad: (() => void) | undefined;

    // If script already loaded, init now; else wait for load event
    // @ts-ignore
    if (window.hbspt?.forms?.create) init();
    else {
      onLoad = () => init();
      document.addEventListener("hsforms:loaded", onLoad, { once: true });
    }

    // Show fallback if form didn't load (e.g. ad blocker)
    const timeout = setTimeout(() => {
      if (!document.querySelector("#hs-contact-form iframe")) {
        const fb = document.getElementById("hs-contact-fallback");
        if (fb) fb.classList.remove("hidden");
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      if (onLoad) document.removeEventListener("hsforms:loaded", onLoad);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Contact | Article6</title>
        <meta
          name="description"
          content="Get in touch with Article6. We’ll get back to you within 48 hours."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              name: "Contact Article6",
              url: "https://www.article6.org/contact",
            }),
          }}
        />
      </Head>

      {/* Load HubSpot v2 loader (EU) once */}
      <Script
        id="hsforms-v2"
        src="https://js-eu1.hsforms.net/forms/embed/v2.js"
        strategy="afterInteractive"
        onLoad={() => document.dispatchEvent(new Event("hsforms:loaded"))}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-16">
        {/* Page header */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Contact</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            We’d love to hear from you. Fill out the form and we’ll get back to you within 48 hours.
          </p>
        </header>

        {/* Two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: intro / details */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-medium">How we respond</h2>
              <ul className="text-sm space-y-2 leading-relaxed">
                <li>• Replies within 48 hours.</li>
                <li>• We keep your details private and never share them.</li>
                <li>• For partnerships, include state/country and a short brief.</li>
              </ul>
              <div className="text-xs text-muted-foreground">
                By submitting, you agree to be contacted about your inquiry.
              </div>
            </div>
          </div>

          {/* Right: form card */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl border bg-white p-4 md:p-6 shadow-sm min-h-[560px]">
              {/* HubSpot will inject an iframe into this div */}
              <div id="hs-contact-form" />
              <div
                id="hs-contact-fallback"
                className="hidden mt-4 text-sm"
              >
                If the form doesn’t load, please use our
                <a
                  className="underline"
                  href="https://share.hsforms.com/eu1/d19a1261-38af-47d2-a668-bfb5b3b24cd5?portalId=146230713"
                  target="_blank"
                  rel="noreferrer"
                >
                  {" "}contact form
                </a>{" "}
                or email
                {" "}
                <a className="underline" href="mailto:hello@article6.org">
                  hello@article6.org
                </a>
                .
              </div>
              <noscript>
                <p className="text-sm mt-4">
                  JavaScript is required to load this form. Please email us:
                  <a className="underline ml-1" href="mailto:hello@article6.org">
                    hello@article6.org
                  </a>
                  .
                </p>
              </noscript>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

