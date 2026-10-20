import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Documento HTML raiz do export web: metadados de PWA (instalável a partir do navegador).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#208AEF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="POHINC" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
