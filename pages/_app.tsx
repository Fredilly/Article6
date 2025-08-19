// pages/_app.tsx
import Head from 'next/head'; // Import Head
import '../styles/globals.css'; // Import global styles
import type { AppProps } from 'next/app';
import Layout from '../components/Layout'; // Import your Layout component
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    // Ensure the first render also starts at the top on all devices
    handleRouteChange();

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Head>
        {/* Add the viewport meta tag here */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* You can add more meta tags here as needed */}
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
