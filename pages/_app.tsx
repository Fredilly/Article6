import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import PreviewLayout from '../components/preview/PreviewLayout';

function MyApp({ Component, pageProps, router }: AppProps) {
  const isPreview = router.pathname.startsWith('/preview/verification-readiness');

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {isPreview && <meta name="robots" content="noindex,nofollow" />}
      </Head>
      {isPreview ? (
        <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
          <PreviewLayout>
            <Component {...pageProps} />
          </PreviewLayout>
        </div>
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
}

export default MyApp;
