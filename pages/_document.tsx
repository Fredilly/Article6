// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang={this.props.__NEXT_DATA__.locale ?? 'en'}>
        {/* Set the document language; default to English but allow dynamic locale if provided */}
        <Head>
          {/* Other tags like your stylesheet links can also go here */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
