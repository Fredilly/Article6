// pages/_app.tsx
import Head from 'next/head'; // Import Head
import '../styles/globals.css'; // Import global styles
import type { AppProps } from 'next/app';
import Layout from '../components/Layout'; // Import your Layout component

function MyApp({ Component, pageProps }: AppProps) {
  // Allow pages to opt out of the layout by setting `noLayout`
  const NoLayout = (Component as any).noLayout;
  const content = <Component {...pageProps} />;

  return (
    <>
      <Head>
        {/* Add the viewport meta tag here */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* You can add more meta tags here as needed */}
      </Head>
      {NoLayout ? content : <Layout>{content}</Layout>}
    </>
  );
}

export default MyApp;
