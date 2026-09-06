import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import InternalLayout from '../components/InternalLayout';
import PreviewLayout from '../components/preview/PreviewLayout';
import SalesCollateralPanel from '../components/SalesCollateralPanel';
import { getAppLayoutKind } from '../lib/layout';
import { Analytics } from '@vercel/analytics/next';

function MyApp({ Component, pageProps, router }: AppProps) {
  const layoutKind = getAppLayoutKind(router.pathname);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="msvalidate.01" content="ACFFD08B0553108B3DA01F18878F6F40" />
        {layoutKind === 'preview' && <meta name="robots" content="noindex,nofollow" />}
      </Head>
      {layoutKind === 'preview' || layoutKind === 'readiness' ? (
        <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
          <PreviewLayout>
            <Component {...pageProps} />
          </PreviewLayout>
        </div>
      ) : layoutKind === 'internal' ? (
        <InternalLayout>
          <Component {...pageProps} />
          <SalesCollateralPanel />
        </InternalLayout>
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
      <Analytics
        beforeSend={(event) => {
          const pathname = new URL(event.url).pathname;

          if (pathname.startsWith('/internal/') || pathname.startsWith('/preview/')) {
            return null;
          }

          return event;
        }}
      />
    </>
  );
}

export default MyApp;
