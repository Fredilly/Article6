// pages/_app.tsx
import Head from 'next/head'; // Import Head
import '../styles/globals.css'; // Import global styles
import type { AppProps } from 'next/app';
import Layout from '../components/Layout'; // Import your Layout component

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Add the viewport meta tag here */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Site metadata */}
        <title>Article6 Ltd</title>
        <meta property="og:site_name" content="Article6 Ltd" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
