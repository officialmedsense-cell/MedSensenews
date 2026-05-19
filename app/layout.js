import Script from 'next/script';

const GA_ID = 'G-GFZ46JKMWT';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="jnE0NxZHyTJjSpUNFeEHJhnJ2GUv958hAQsRDsejMbc" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6268594865479039" 
          crossOrigin="anonymous" 
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}

        {/* Google Analytics GA4 — loads after page is interactive */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
