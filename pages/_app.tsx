import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import InternalLayout from '../components/InternalLayout';
import PreviewLayout from '../components/preview/PreviewLayout';
import { getAppLayoutKind } from '../lib/layout';

function MyApp({ Component, pageProps, router }: AppProps) {
  const layoutKind = getAppLayoutKind(router.pathname);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {layoutKind === 'preview' && <meta name="robots" content="noindex,nofollow" />}
      </Head>
      {layoutKind === 'preview' ? (
        <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
          <PreviewLayout>
            <Component {...pageProps} />
          </PreviewLayout>
        </div>
      ) : layoutKind === 'internal' ? (
        <InternalLayout>
          <Component {...pageProps} />
        </InternalLayout>
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
}

export default MyApp;
